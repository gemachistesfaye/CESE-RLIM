import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, BudgetCategory, Prisma } from '@prisma/client';
import { CreateBudgetAllocationDto } from './dto/create-budget-allocation.dto';
import { UpdateBudgetAllocationDto } from './dto/update-budget-allocation.dto';

const ALLOCATION_SELECT = {
  id: true,
  researchGrantId: true,
  category: true,
  allocatedAmount: true,
  description: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  researchGrant: { select: { id: true, grantNumber: true, awardedAmount: true, spentAmount: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  expenses: {
    select: { id: true, amount: true, status: true },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.BudgetAllocationSelect;

@Injectable()
export class BudgetAllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    researchGrantId?: string;
    category?: string;
  }) {
    const { page, limit, researchGrantId, category } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (researchGrantId) where.researchGrantId = researchGrantId;
    if (category) where.category = category as BudgetCategory;

    const [items, total] = await Promise.all([
      this.prisma.budgetAllocation.findMany({
        where,
        select: ALLOCATION_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.budgetAllocation.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const allocation = await this.prisma.budgetAllocation.findUnique({
      where: { id },
      select: ALLOCATION_SELECT,
    });

    if (!allocation) {
      throw new NotFoundException('Budget allocation not found');
    }

    return allocation;
  }

  async findByGrant(researchGrantId: string) {
    const allocations = await this.prisma.budgetAllocation.findMany({
      where: { researchGrantId },
      select: ALLOCATION_SELECT,
      orderBy: { category: 'asc' },
    });

    return allocations;
  }

  async getCategorySummary(researchGrantId: string) {
    const allocations = await this.prisma.budgetAllocation.findMany({
      where: { researchGrantId },
      select: {
        category: true,
        allocatedAmount: true,
        expenses: {
          select: { amount: true, status: true },
          where: { status: { in: ['APPROVED', 'RECORDED'] } },
        },
      },
    });

    const grant = await this.prisma.researchGrant.findUnique({
      where: { id: researchGrantId },
      select: { awardedAmount: true },
    });

    const categories = Object.values(BudgetCategory).map(cat => {
      const alloc = allocations.find(a => a.category === cat);
      const allocated = alloc ? Number(alloc.allocatedAmount) : 0;
      const spent = alloc ? alloc.expenses.reduce((sum, e) => sum + Number(e.amount), 0) : 0;
      return {
        category: cat,
        allocated,
        spent,
        remaining: allocated - spent,
        utilization: allocated > 0 ? Math.round((spent / allocated) * 100 * 100) / 100 : 0,
      };
    });

    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const totalSpent = allocations.reduce((sum, a) => sum + a.expenses.reduce((s, e) => s + Number(e.amount), 0), 0);

    return {
      grantBudget: grant ? Number(grant.awardedAmount) : 0,
      totalAllocated,
      totalSpent,
      remaining: totalAllocated - totalSpent,
      utilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100 * 100) / 100 : 0,
      categories,
    };
  }

  async create(dto: CreateBudgetAllocationDto, userId: string) {
    const grant = await this.prisma.researchGrant.findUnique({
      where: { id: dto.researchGrantId },
      select: { id: true, awardedAmount: true, status: true },
    });

    if (!grant) {
      throw new NotFoundException('Research grant not found');
    }

    if (grant.status !== 'ACTIVE') {
      throw new BadRequestException('Can only allocate budget to active grants');
    }

    if (Number(dto.allocatedAmount) <= 0) {
      throw new BadRequestException('Allocated amount must be greater than zero');
    }

    const existingAllocations = await this.prisma.budgetAllocation.aggregate({
      where: { researchGrantId: dto.researchGrantId },
      _sum: { allocatedAmount: true },
    });

    const currentTotal = Number(existingAllocations._sum.allocatedAmount || 0);
    const newTotal = currentTotal + Number(dto.allocatedAmount);

    if (newTotal > Number(grant.awardedAmount)) {
      throw new BadRequestException(
        `Total allocations (${newTotal}) would exceed grant budget (${grant.awardedAmount})`,
      );
    }

    const existingCategory = await this.prisma.budgetAllocation.findFirst({
      where: { researchGrantId: dto.researchGrantId, category: dto.category },
    });

    if (existingCategory) {
      throw new BadRequestException(`Allocation already exists for category ${dto.category}`);
    }

    const allocation = await this.prisma.budgetAllocation.create({
      data: {
        researchGrantId: dto.researchGrantId,
        category: dto.category,
        allocatedAmount: new Prisma.Decimal(dto.allocatedAmount),
        description: dto.description,
        createdById: userId,
      },
      select: ALLOCATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'BudgetAllocation',
      entityId: allocation.id,
      description: `Created budget allocation for ${dto.category} in grant`,
      metadata: { researchGrantId: dto.researchGrantId, category: dto.category, amount: dto.allocatedAmount },
    });

    return allocation;
  }

  async update(id: string, dto: UpdateBudgetAllocationDto, userId: string) {
    const existing = await this.prisma.budgetAllocation.findUnique({
      where: { id },
      select: { id: true, researchGrantId: true, category: true, allocatedAmount: true },
    });

    if (!existing) {
      throw new NotFoundException('Budget allocation not found');
    }

    const grant = await this.prisma.researchGrant.findUnique({
      where: { id: existing.researchGrantId },
      select: { awardedAmount: true, status: true },
    });

    if (grant?.status !== 'ACTIVE') {
      throw new BadRequestException('Can only update allocations for active grants');
    }

    if (dto.allocatedAmount && Number(dto.allocatedAmount) <= 0) {
      throw new BadRequestException('Allocated amount must be greater than zero');
    }

    if (dto.category && dto.category !== existing.category) {
      const duplicateCategory = await this.prisma.budgetAllocation.findFirst({
        where: {
          researchGrantId: existing.researchGrantId,
          category: dto.category,
          id: { not: id },
        },
      });

      if (duplicateCategory) {
        throw new BadRequestException(`Allocation already exists for category ${dto.category}`);
      }
    }

    if (dto.allocatedAmount) {
      const otherAllocations = await this.prisma.budgetAllocation.aggregate({
        where: { researchGrantId: existing.researchGrantId, id: { not: id } },
        _sum: { allocatedAmount: true },
      });

      const otherTotal = Number(otherAllocations._sum.allocatedAmount || 0);
      const newTotal = otherTotal + Number(dto.allocatedAmount);

      if (newTotal > Number(grant!.awardedAmount)) {
        throw new BadRequestException(
          `Total allocations (${newTotal}) would exceed grant budget (${grant!.awardedAmount})`,
        );
      }
    }

    const allocation = await this.prisma.budgetAllocation.update({
      where: { id },
      data: {
        ...(dto.category && { category: dto.category }),
        ...(dto.allocatedAmount && { allocatedAmount: new Prisma.Decimal(dto.allocatedAmount) }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      select: ALLOCATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'BudgetAllocation',
      entityId: id,
      description: `Updated budget allocation ${existing.category}`,
      metadata: { researchGrantId: existing.researchGrantId, changedFields: Object.keys(dto).filter(k => dto[k as keyof UpdateBudgetAllocationDto] !== undefined) },
    });

    return allocation;
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.budgetAllocation.findUnique({
      where: { id },
      select: { id: true, researchGrantId: true, category: true, expenses: { select: { id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Budget allocation not found');
    }

    if (existing.expenses.length > 0) {
      throw new BadRequestException('Cannot delete allocation with existing expenses');
    }

    await this.prisma.budgetAllocation.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'BudgetAllocation',
      entityId: id,
      description: `Deleted budget allocation ${existing.category}`,
      metadata: { researchGrantId: existing.researchGrantId, category: existing.category },
    });

    return { message: 'Budget allocation deleted' };
  }
}
