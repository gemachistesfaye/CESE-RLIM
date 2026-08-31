import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ExpenseStatus, BudgetCategory, Prisma, UserRole } from '@prisma/client';
import { CreateResearchExpenseDto } from './dto/create-research-expense.dto';
import { UpdateResearchExpenseDto } from './dto/update-research-expense.dto';

const EXPENSE_SELECT = {
  id: true,
  expenseCode: true,
  researchGrantId: true,
  researchProjectId: true,
  budgetAllocationId: true,
  category: true,
  description: true,
  amount: true,
  expenseDate: true,
  vendor: true,
  referenceNumber: true,
  status: true,
  submittedById: true,
  approvedById: true,
  approvedAt: true,
  rejectionReason: true,
  receiptDocumentId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  researchGrant: { select: { id: true, grantNumber: true, awardedAmount: true, spentAmount: true } },
  researchProject: { select: { id: true, projectCode: true, title: true } },
  budgetAllocation: { select: { id: true, category: true, allocatedAmount: true } },
  submittedBy: { select: { id: true, userId: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  receiptDocument: { select: { id: true, title: true, fileName: true } },
} satisfies Prisma.ResearchExpenseSelect;

const VALID_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  DRAFT: [ExpenseStatus.SUBMITTED, ExpenseStatus.CANCELLED],
  SUBMITTED: [ExpenseStatus.UNDER_REVIEW, ExpenseStatus.CANCELLED],
  UNDER_REVIEW: [ExpenseStatus.APPROVED, ExpenseStatus.REJECTED],
  APPROVED: [ExpenseStatus.RECORDED],
  REJECTED: [],
  RECORDED: [],
  CANCELLED: [],
};

@Injectable()
export class ResearchExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    category?: string;
    researchGrantId?: string;
    researchProjectId?: string;
    submittedById?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    userRole?: UserRole;
  }) {
    const { page, limit, search, status, category, researchGrantId, researchProjectId, submittedById, startDate, endDate, minAmount, maxAmount, sortBy = 'createdAt', sortOrder = 'desc', userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status as ExpenseStatus;
    if (category) where.category = category as BudgetCategory;
    if (researchGrantId) where.researchGrantId = researchGrantId;
    if (researchProjectId) where.researchProjectId = researchProjectId;
    if (submittedById) where.submittedById = submittedById;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) (where.expenseDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.expenseDate as Record<string, unknown>).lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) (where.amount as Record<string, unknown>).gte = new Prisma.Decimal(minAmount);
      if (maxAmount) (where.amount as Record<string, unknown>).lte = new Prisma.Decimal(maxAmount);
    }

    if (search) {
      where.OR = [
        { expenseCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userId && userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
      if (researcher) {
        where.submittedById = researcher.id;
      } else {
        where.id = '__nonexistent__';
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    if (['expenseCode', 'amount', 'status', 'category', 'expenseDate', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchExpense.findMany({
        where,
        select: EXPENSE_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.researchExpense.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMyExpenses(params: { userId: string; page: number; limit: number; status?: string }) {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const where: Record<string, unknown> = { submittedById: researcher.id };
    if (status) where.status = status as ExpenseStatus;

    const [items, total] = await Promise.all([
      this.prisma.researchExpense.findMany({
        where,
        select: EXPENSE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.researchExpense.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPending(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = { status: { in: [ExpenseStatus.SUBMITTED, ExpenseStatus.UNDER_REVIEW] } };

    const [items, total] = await Promise.all([
      this.prisma.researchExpense.findMany({
        where,
        select: EXPENSE_SELECT,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.researchExpense.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const expense = await this.prisma.researchExpense.findUnique({
      where: { id },
      select: EXPENSE_SELECT,
    });

    if (!expense) {
      throw new NotFoundException('Research expense not found');
    }

    return expense;
  }

  async getSummary() {
    const now = new Date();
    const [total, draft, submitted, underReview, approved, rejected, recorded, cancelled, pendingAmount, approvedAmount, totalSpent] = await Promise.all([
      this.prisma.researchExpense.count(),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.DRAFT } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.SUBMITTED } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.UNDER_REVIEW } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.APPROVED } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.REJECTED } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.RECORDED } }),
      this.prisma.researchExpense.count({ where: { status: ExpenseStatus.CANCELLED } }),
      this.prisma.researchExpense.aggregate({ _sum: { amount: true }, where: { status: { in: [ExpenseStatus.SUBMITTED, ExpenseStatus.UNDER_REVIEW] } } }),
      this.prisma.researchExpense.aggregate({ _sum: { amount: true }, where: { status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.RECORDED] } } }),
      this.prisma.researchGrant.aggregate({ _sum: { spentAmount: true } }),
    ]);

    const byCategory = await this.prisma.researchExpense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.RECORDED] } },
    });

    const spendingByCategory: Record<string, number> = {};
    byCategory.forEach(item => { spendingByCategory[item.category] = Number(item._sum.amount || 0); });

    return {
      total, draft, submitted, underReview, approved, rejected, recorded, cancelled,
      pendingAmount: Number(pendingAmount._sum.amount || 0),
      approvedAmount: Number(approvedAmount._sum.amount || 0),
      totalSpent: Number(totalSpent._sum.spentAmount || 0),
      spendingByCategory,
    };
  }

  async getGrantExpenses(researchGrantId: string) {
    const expenses = await this.prisma.researchExpense.findMany({
      where: { researchGrantId },
      select: {
        id: true,
        expenseCode: true,
        category: true,
        description: true,
        amount: true,
        expenseDate: true,
        status: true,
        vendor: true,
        submittedBy: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 20,
    });

    return expenses;
  }

  async create(dto: CreateResearchExpenseDto, userId: string) {
    const grant = await this.prisma.researchGrant.findUnique({
      where: { id: dto.researchGrantId },
      select: { id: true, awardedAmount: true, spentAmount: true, status: true },
    });

    if (!grant) {
      throw new NotFoundException('Research grant not found');
    }

    if (grant.status !== 'ACTIVE') {
      throw new BadRequestException('Can only create expenses for active grants');
    }

    if (Number(dto.amount) <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
      if (!project) throw new NotFoundException('Research project not found');
    }

    if (dto.budgetAllocationId) {
      const allocation = await this.prisma.budgetAllocation.findUnique({ where: { id: dto.budgetAllocationId } });
      if (!allocation) throw new NotFoundException('Budget allocation not found');
      if (allocation.researchGrantId !== dto.researchGrantId) {
        throw new BadRequestException('Budget allocation does not belong to this grant');
      }
    }

    if (dto.receiptDocumentId) {
      const doc = await this.prisma.researchDocument.findUnique({ where: { id: dto.receiptDocumentId } });
      if (!doc) throw new NotFoundException('Receipt document not found');
    }

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const count = await this.prisma.researchExpense.count();
    const expenseCode = `EXP-${String(count + 1).padStart(5, '0')}`;

    const expense = await this.prisma.researchExpense.create({
      data: {
        expenseCode,
        researchGrantId: dto.researchGrantId,
        researchProjectId: dto.researchProjectId || null,
        budgetAllocationId: dto.budgetAllocationId || null,
        category: dto.category,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        expenseDate: new Date(dto.expenseDate),
        vendor: dto.vendor,
        referenceNumber: dto.referenceNumber,
        receiptDocumentId: dto.receiptDocumentId || null,
        notes: dto.notes,
        submittedById: researcher.id,
        status: ExpenseStatus.DRAFT,
      },
      select: EXPENSE_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchExpense',
      entityId: expense.id,
      description: `Created expense ${expenseCode}`,
      metadata: { expenseCode, category: dto.category, amount: dto.amount, researchGrantId: dto.researchGrantId },
    });

    return expense;
  }

  async update(id: string, dto: UpdateResearchExpenseDto, userId: string, userRole: UserRole) {
    const existing = await this.prisma.researchExpense.findUnique({
      where: { id },
      select: { id: true, submittedById: true, status: true, researchGrantId: true, amount: true },
    });

    if (!existing) {
      throw new NotFoundException('Research expense not found');
    }

    if (existing.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only edit draft expenses');
    }

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
      if (!researcher || existing.submittedById !== researcher.id) {
        throw new ForbiddenException('You can only edit your own expenses');
      }
    }

    if (dto.budgetAllocationId) {
      const allocation = await this.prisma.budgetAllocation.findUnique({ where: { id: dto.budgetAllocationId } });
      if (!allocation) throw new NotFoundException('Budget allocation not found');
      if (allocation.researchGrantId !== existing.researchGrantId) {
        throw new BadRequestException('Budget allocation does not belong to this grant');
      }
    }

    if (dto.amount && Number(dto.amount) <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero');
    }

    const expense = await this.prisma.researchExpense.update({
      where: { id },
      data: {
        ...(dto.budgetAllocationId !== undefined && { budgetAllocationId: dto.budgetAllocationId || null }),
        ...(dto.category && { category: dto.category }),
        ...(dto.description && { description: dto.description }),
        ...(dto.amount && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
        ...(dto.vendor !== undefined && { vendor: dto.vendor }),
        ...(dto.referenceNumber !== undefined && { referenceNumber: dto.referenceNumber }),
        ...(dto.receiptDocumentId !== undefined && { receiptDocumentId: dto.receiptDocumentId || null }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: EXPENSE_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchExpense',
      entityId: id,
      description: `Updated expense ${existing.status}`,
      metadata: { expenseId: id, changedFields: Object.keys(dto).filter(k => dto[k as keyof UpdateResearchExpenseDto] !== undefined) },
    });

    return expense;
  }

  async submit(id: string, userId: string) {
    const existing = await this.prisma.researchExpense.findUnique({
      where: { id },
      select: { id: true, status: true, submittedById: true, researchGrantId: true, amount: true },
    });

    if (!existing) {
      throw new NotFoundException('Research expense not found');
    }

    if (existing.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only submit draft expenses');
    }

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher || existing.submittedById !== researcher.id) {
      throw new ForbiddenException('You can only submit your own expenses');
    }

    const expense = await this.prisma.researchExpense.update({
      where: { id },
      data: { status: ExpenseStatus.SUBMITTED },
      select: EXPENSE_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.SUBMIT,
      entityType: 'ResearchExpense',
      entityId: id,
      description: `Submitted expense ${expense.expenseCode}`,
      metadata: { expenseCode: expense.expenseCode, amount: existing.amount.toString() },
    });

    return expense;
  }

  async review(id: string, status: ExpenseStatus, rejectionReason: string | undefined, userId: string) {
    const existing = await this.prisma.researchExpense.findUnique({
      where: { id },
      select: { id: true, status: true, researchGrantId: true, amount: true, expenseCode: true },
    });

    if (!existing) {
      throw new NotFoundException('Research expense not found');
    }

    if (existing.status !== ExpenseStatus.SUBMITTED && existing.status !== ExpenseStatus.UNDER_REVIEW) {
      throw new BadRequestException('Can only review submitted expenses');
    }

    if (status !== ExpenseStatus.APPROVED && status !== ExpenseStatus.REJECTED) {
      throw new BadRequestException('Review status must be APPROVED or REJECTED');
    }

    if (status === ExpenseStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    if (status === ExpenseStatus.APPROVED) {
      const grant = await this.prisma.researchGrant.findUnique({
        where: { id: existing.researchGrantId },
        select: { awardedAmount: true, spentAmount: true },
      });

      if (grant) {
        const newSpent = Number(grant.spentAmount) + Number(existing.amount);
        if (newSpent > Number(grant.awardedAmount)) {
          throw new BadRequestException(
            `Approving this expense would exceed grant budget. Current spent: ${grant.spentAmount}, expense: ${existing.amount}, budget: ${grant.awardedAmount}`,
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {
      status,
      approvedById: (await this.prisma.user.findFirst({ where: {}, select: { id: true } }))?.id,
      approvedAt: new Date(),
    };
    if (status === ExpenseStatus.REJECTED) {
      updateData.rejectionReason = rejectionReason;
    }

    await this.prisma.researchExpense.update({
      where: { id },
      data: updateData,
    });

    if (status === ExpenseStatus.APPROVED) {
      await this.prisma.researchGrant.update({
        where: { id: existing.researchGrantId },
        data: { spentAmount: { increment: Number(existing.amount) } },
      });
    }

    await this.auditService.log({
      userId,
      action: status === ExpenseStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
      entityType: 'ResearchExpense',
      entityId: id,
      description: `${status === ExpenseStatus.APPROVED ? 'Approved' : 'Rejected'} expense ${existing.expenseCode}`,
      metadata: { expenseCode: existing.expenseCode, amount: existing.amount.toString(), status, rejectionReason },
    });

    return this.findById(id);
  }

  async updateStatus(id: string, newStatus: ExpenseStatus, userId: string) {
    const existing = await this.prisma.researchExpense.findUnique({
      where: { id },
      select: { id: true, status: true, expenseCode: true },
    });

    if (!existing) {
      throw new NotFoundException('Research expense not found');
    }

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${newStatus}`);
    }

    const expense = await this.prisma.researchExpense.update({
      where: { id },
      data: { status: newStatus },
      select: EXPENSE_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'ResearchExpense',
      entityId: id,
      description: `Changed expense ${existing.expenseCode} status to ${newStatus}`,
      metadata: { expenseCode: existing.expenseCode, previousStatus: existing.status, newStatus },
    });

    return expense;
  }
}
