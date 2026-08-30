import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFundingOpportunityDto } from './dto/create-funding-opportunity.dto';
import { UpdateFundingOpportunityDto } from './dto/update-funding-opportunity.dto';
import { UpdateFundingOpportunityStatusDto } from './dto/update-funding-opportunity-status.dto';
import {
  AuditAction,
  FundingType,
  FundingOpportunityStatus,
  Prisma,
} from '@prisma/client';

const FUNDING_OPPORTUNITY_SELECT = {
  id: true,
  title: true,
  organization: true,
  description: true,
  fundingType: true,
  minimumAmount: true,
  maximumAmount: true,
  applicationDeadline: true,
  eligibilityCriteria: true,
  applicationUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FundingOpportunitySelect;

@Injectable()
export class FundingOpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    fundingType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      search,
      status,
      fundingType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.FundingOpportunityWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { organization: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status) {
      where.status = status as FundingOpportunityStatus;
    }

    if (fundingType) {
      where.fundingType = fundingType as FundingType;
    }

    const [items, total] = await Promise.all([
      this.prisma.fundingOpportunity.findMany({
        where,
        select: FUNDING_OPPORTUNITY_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fundingOpportunity.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const opportunity = await this.prisma.fundingOpportunity.findUnique({
      where: { id },
      select: FUNDING_OPPORTUNITY_SELECT,
    });

    if (!opportunity) {
      throw new NotFoundException('Funding opportunity not found');
    }

    return opportunity;
  }

  async getSummary() {
    const now = new Date();

    const [
      total,
      open,
      closed,
      upcoming,
      cancelled,
      expiringSoon,
    ] = await Promise.all([
      this.prisma.fundingOpportunity.count({}),
      this.prisma.fundingOpportunity.count({ where: { status: FundingOpportunityStatus.OPEN } }),
      this.prisma.fundingOpportunity.count({ where: { status: FundingOpportunityStatus.CLOSED } }),
      this.prisma.fundingOpportunity.count({ where: { status: FundingOpportunityStatus.UPCOMING } }),
      this.prisma.fundingOpportunity.count({ where: { status: FundingOpportunityStatus.CANCELLED } }),
      this.prisma.fundingOpportunity.count({
        where: {
          status: FundingOpportunityStatus.OPEN,
          applicationDeadline: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const byFundingType = await this.prisma.fundingOpportunity.groupBy({
      by: ['fundingType'],
      _count: { id: true },
    });

    const fundingTypeBreakdown = byFundingType.reduce(
      (acc, item) => {
        acc[item.fundingType] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      open,
      closed,
      upcoming,
      cancelled,
      expiringSoon,
      fundingTypeBreakdown,
    };
  }

  async create(dto: CreateFundingOpportunityDto, userId: string) {
    if (dto.minimumAmount !== undefined && dto.maximumAmount !== undefined) {
      if (dto.minimumAmount > dto.maximumAmount) {
        throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
      }
    }

    if (dto.applicationDeadline) {
      const deadline = new Date(dto.applicationDeadline);
      if (deadline < new Date()) {
        throw new BadRequestException('Application deadline cannot be in the past');
      }
    }

    const opportunity = await this.prisma.fundingOpportunity.create({
      data: {
        title: dto.title.trim(),
        organization: dto.organization.trim(),
        description: dto.description?.trim(),
        fundingType: dto.fundingType,
        minimumAmount: dto.minimumAmount,
        maximumAmount: dto.maximumAmount,
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
        eligibilityCriteria: dto.eligibilityCriteria?.trim(),
        applicationUrl: dto.applicationUrl,
        status: dto.status || FundingOpportunityStatus.OPEN,
      },
      select: FUNDING_OPPORTUNITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'FundingOpportunity',
      entityId: opportunity.id,
      description: `Created funding opportunity "${opportunity.title}" from ${opportunity.organization}`,
      metadata: {
        fundingType: opportunity.fundingType,
        status: opportunity.status,
        minimumAmount: opportunity.minimumAmount,
        maximumAmount: opportunity.maximumAmount,
      },
    });

    return opportunity;
  }

  async update(id: string, dto: UpdateFundingOpportunityDto, userId: string) {
    const existing = await this.findById(id);

    if (dto.minimumAmount !== undefined && dto.maximumAmount !== undefined) {
      if (dto.minimumAmount > dto.maximumAmount) {
        throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
      }
    } else if (dto.minimumAmount !== undefined && existing.maximumAmount) {
      if (dto.minimumAmount > Number(existing.maximumAmount)) {
        throw new BadRequestException('Minimum amount cannot be greater than existing maximum amount');
      }
    } else if (dto.maximumAmount !== undefined && existing.minimumAmount) {
      if (Number(existing.minimumAmount) > dto.maximumAmount) {
        throw new BadRequestException('Maximum amount cannot be less than existing minimum amount');
      }
    }

    const opportunity = await this.prisma.fundingOpportunity.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        organization: dto.organization?.trim(),
        description: dto.description?.trim(),
        fundingType: dto.fundingType,
        minimumAmount: dto.minimumAmount,
        maximumAmount: dto.maximumAmount,
        applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : undefined,
        eligibilityCriteria: dto.eligibilityCriteria?.trim(),
        applicationUrl: dto.applicationUrl,
      },
      select: FUNDING_OPPORTUNITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'FundingOpportunity',
      entityId: id,
      description: `Updated funding opportunity "${opportunity.title}"`,
      metadata: {
        changes: dto,
      },
    });

    return opportunity;
  }

  async updateStatus(id: string, dto: UpdateFundingOpportunityStatusDto, userId: string) {
    const existing = await this.findById(id);

    if (existing.status === dto.status) {
      throw new BadRequestException(`Opportunity is already ${dto.status}`);
    }

    const opportunity = await this.prisma.fundingOpportunity.update({
      where: { id },
      data: { status: dto.status },
      select: FUNDING_OPPORTUNITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'FundingOpportunity',
      entityId: id,
      description: `Changed funding opportunity "${opportunity.title}" status from ${existing.status} to ${dto.status}`,
      metadata: {
        previousStatus: existing.status,
        newStatus: dto.status,
      },
    });

    return opportunity;
  }

  async delete(id: string, userId: string) {
    const existing = await this.findById(id);

    await this.prisma.fundingOpportunity.delete({
      where: { id },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'FundingOpportunity',
      entityId: id,
      description: `Deleted funding opportunity "${existing.title}" from ${existing.organization}`,
      metadata: {
        title: existing.title,
        organization: existing.organization,
        fundingType: existing.fundingType,
        status: existing.status,
      },
    });

    return existing;
  }
}
