import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateResearchGrantDto } from './dto/create-research-grant.dto';
import { UpdateResearchGrantDto } from './dto/update-research-grant.dto';
import { UpdateGrantSpendingDto } from './dto/update-grant-spending.dto';
import {
  AuditAction,
  GrantStatus,
  GrantApplicationStatus,
  Prisma,
} from '@prisma/client';

const RESEARCH_GRANT_SELECT = {
  id: true,
  grantNumber: true,
  applicationId: true,
  researchProjectId: true,
  principalInvestigatorId: true,
  createdById: true,
  awardedAmount: true,
  startDate: true,
  endDate: true,
  spentAmount: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  application: {
    select: {
      id: true,
      title: true,
      requestedAmount: true,
      status: true,
      opportunity: {
        select: {
          id: true,
          title: true,
          fundingType: true,
        },
      },
      applicant: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  },
  researchProject: {
    select: {
      id: true,
      projectCode: true,
      title: true,
      projectStatus: true,
    },
  },
  principalInvestigator: {
    select: {
      id: true,
      userId: true,
      employeeOrStudentId: true,
      department: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.ResearchGrantSelect;

const VALID_TRANSITIONS: Record<GrantStatus, GrantStatus[]> = {
  [GrantStatus.ACTIVE]: [
    GrantStatus.ON_HOLD,
    GrantStatus.COMPLETED,
    GrantStatus.SUSPENDED,
    GrantStatus.CANCELLED,
  ],
  [GrantStatus.ON_HOLD]: [GrantStatus.ACTIVE, GrantStatus.CANCELLED],
  [GrantStatus.SUSPENDED]: [GrantStatus.ACTIVE, GrantStatus.CANCELLED],
  [GrantStatus.COMPLETED]: [],
  [GrantStatus.CANCELLED]: [],
};

@Injectable()
export class ResearchGrantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    researchProjectId?: string;
    principalInvestigatorId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      search,
      status,
      researchProjectId,
      principalInvestigatorId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ResearchGrantWhereInput = {};

    if (search) {
      const searchFilter = {
        OR: [
          { grantNumber: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
          { application: { title: { contains: search, mode: 'insensitive' as const } } },
          { researchProject: { title: { contains: search, mode: 'insensitive' as const } } },
          { researchProject: { projectCode: { contains: search, mode: 'insensitive' as const } } },
          {
            principalInvestigator: {
              user: {
                firstName: { contains: search, mode: 'insensitive' as const },
              },
            },
          },
          {
            principalInvestigator: {
              user: {
                lastName: { contains: search, mode: 'insensitive' as const },
              },
            },
          },
        ],
      };
      if (where.AND) {
        const existingAnd = Array.isArray(where.AND) ? where.AND : [where.AND];
        where.AND = [...existingAnd, searchFilter];
      } else {
        where.AND = [searchFilter];
      }
    }

    if (status) {
      where.status = status as GrantStatus;
    }

    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    if (principalInvestigatorId) {
      where.principalInvestigatorId = principalInvestigatorId;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchGrant.findMany({
        where,
        select: RESEARCH_GRANT_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchGrant.count({ where }),
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
    const grant = await this.prisma.researchGrant.findUnique({
      where: { id },
      select: RESEARCH_GRANT_SELECT,
    });

    if (!grant) {
      throw new NotFoundException('Research grant not found');
    }

    return grant;
  }

  async getSummary() {
    const now = new Date();

    const [
      totalGrants,
      activeGrants,
      completedGrants,
      suspendedGrants,
      cancelledGrants,
      onHoldGrants,
      totalAwardedAgg,
      totalSpentAgg,
    ] = await Promise.all([
      this.prisma.researchGrant.count(),
      this.prisma.researchGrant.count({ where: { status: GrantStatus.ACTIVE } }),
      this.prisma.researchGrant.count({ where: { status: GrantStatus.COMPLETED } }),
      this.prisma.researchGrant.count({ where: { status: GrantStatus.SUSPENDED } }),
      this.prisma.researchGrant.count({ where: { status: GrantStatus.CANCELLED } }),
      this.prisma.researchGrant.count({ where: { status: GrantStatus.ON_HOLD } }),
      this.prisma.researchGrant.aggregate({ _sum: { awardedAmount: true } }),
      this.prisma.researchGrant.aggregate({ _sum: { spentAmount: true } }),
    ]);

    const totalAwarded = totalAwardedAgg._sum.awardedAmount ?? 0;
    const totalSpent = totalSpentAgg._sum.spentAmount ?? 0;
    const totalRemaining = new Prisma.Decimal(totalAwarded).minus(totalSpent);

    return {
      totalGrants,
      activeGrants,
      completedGrants,
      suspendedGrants,
      cancelledGrants,
      onHoldGrants,
      totalAwarded,
      totalSpent,
      totalRemaining,
    };
  }

  async getMyGrants(userId: string, params: {
    page: number;
    limit: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const researcher = await this.prisma.researcher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const where: Prisma.ResearchGrantWhereInput = {
      OR: [
        { principalInvestigatorId: researcher.id },
        { createdById: userId },
      ],
    };

    if (status) {
      where.status = status as GrantStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchGrant.findMany({
        where,
        select: RESEARCH_GRANT_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchGrant.count({ where }),
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

  async create(dto: CreateResearchGrantDto, userId: string) {
    const existingGrantNumber = await this.prisma.researchGrant.findUnique({
      where: { grantNumber: dto.grantNumber },
    });

    if (existingGrantNumber) {
      throw new BadRequestException('Grant number already exists');
    }

    const application = await this.prisma.grantApplication.findUnique({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException('Grant application not found');
    }

    if (application.status !== GrantApplicationStatus.APPROVED) {
      throw new BadRequestException(
        'Grant can only be created from an APPROVED application',
      );
    }

    const existingGrantForApp = await this.prisma.researchGrant.findUnique({
      where: { applicationId: dto.applicationId },
    });

    if (existingGrantForApp) {
      throw new BadRequestException(
        'A grant already exists for this application',
      );
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    if (dto.principalInvestigatorId) {
      const pi = await this.prisma.researcher.findUnique({
        where: { id: dto.principalInvestigatorId },
      });
      if (!pi) {
        throw new NotFoundException('Principal investigator not found');
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const awardedAmount = new Prisma.Decimal(dto.awardedAmount);
    if (awardedAmount.lte(0)) {
      throw new BadRequestException('Awarded amount must be greater than zero');
    }

    const status = dto.status || GrantStatus.ACTIVE;

    const grant = await this.prisma.researchGrant.create({
      data: {
        grantNumber: dto.grantNumber.trim(),
        applicationId: dto.applicationId,
        researchProjectId: dto.researchProjectId || null,
        principalInvestigatorId: dto.principalInvestigatorId || null,
        awardedAmount,
        startDate,
        endDate,
        spentAmount: 0,
        status,
        notes: dto.notes?.trim() || null,
        createdById: userId,
      },
      select: RESEARCH_GRANT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchGrant',
      entityId: grant.id,
      description: `Created research grant "${grant.grantNumber}" with awarded amount ${grant.awardedAmount}`,
      metadata: {
        grantNumber: grant.grantNumber,
        applicationId: dto.applicationId,
        researchProjectId: dto.researchProjectId,
        principalInvestigatorId: dto.principalInvestigatorId,
        awardedAmount: grant.awardedAmount,
        status: grant.status,
      },
    });

    return grant;
  }

  async update(id: string, dto: UpdateResearchGrantDto, userId: string) {
    const existing = await this.findById(id);

    if (
      existing.status === GrantStatus.COMPLETED ||
      existing.status === GrantStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update a ${existing.status.toLowerCase()} grant`,
      );
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    if (dto.principalInvestigatorId) {
      const pi = await this.prisma.researcher.findUnique({
        where: { id: dto.principalInvestigatorId },
      });
      if (!pi) {
        throw new NotFoundException('Principal investigator not found');
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const awardedAmount = dto.awardedAmount
      ? new Prisma.Decimal(dto.awardedAmount)
      : new Prisma.Decimal(existing.awardedAmount);
    const spentAmount = new Prisma.Decimal(existing.spentAmount);
    if (spentAmount.gt(awardedAmount)) {
      throw new BadRequestException(
        'Awarded amount cannot be less than the already spent amount',
      );
    }

    const grant = await this.prisma.researchGrant.update({
      where: { id },
      data: {
        researchProjectId: dto.researchProjectId !== undefined ? dto.researchProjectId : undefined,
        principalInvestigatorId:
          dto.principalInvestigatorId !== undefined ? dto.principalInvestigatorId : undefined,
        awardedAmount: dto.awardedAmount !== undefined ? awardedAmount : undefined,
        startDate: dto.startDate ? startDate : undefined,
        endDate: dto.endDate ? endDate : undefined,
        notes: dto.notes?.trim(),
      },
      select: RESEARCH_GRANT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchGrant',
      entityId: id,
      description: `Updated research grant "${grant.grantNumber}"`,
      metadata: {
        grantNumber: grant.grantNumber,
        changes: dto,
      },
    });

    return grant;
  }

  async updateStatus(id: string, newStatus: GrantStatus, userId: string) {
    const existing = await this.findById(id);

    const allowedTransitions = VALID_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${newStatus}`,
      );
    }

    const grant = await this.prisma.researchGrant.update({
      where: { id },
      data: { status: newStatus },
      select: RESEARCH_GRANT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'ResearchGrant',
      entityId: id,
      description: `Changed grant "${grant.grantNumber}" status from ${existing.status} to ${newStatus}`,
      metadata: {
        grantNumber: grant.grantNumber,
        previousStatus: existing.status,
        newStatus,
      },
    });

    return grant;
  }

  async updateSpending(id: string, dto: UpdateGrantSpendingDto, userId: string) {
    const existing = await this.findById(id);

    if (
      existing.status === GrantStatus.COMPLETED ||
      existing.status === GrantStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update spending on a ${existing.status.toLowerCase()} grant`,
      );
    }

    const additionalSpending = new Prisma.Decimal(dto.spentAmount);
    if (additionalSpending.lte(0)) {
      throw new BadRequestException('Spending amount must be greater than zero');
    }

    const newTotalSpent = new Prisma.Decimal(existing.spentAmount).plus(additionalSpending);
    const awardedAmount = new Prisma.Decimal(existing.awardedAmount);

    if (newTotalSpent.gt(awardedAmount)) {
      throw new BadRequestException(
        `Spending of ${dto.spentAmount} would exceed the awarded amount. Current spent: ${existing.spentAmount}, awarded: ${existing.awardedAmount}`,
      );
    }

    const grant = await this.prisma.researchGrant.update({
      where: { id },
      data: { spentAmount: newTotalSpent },
      select: RESEARCH_GRANT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.SPENDING_UPDATE,
      entityType: 'ResearchGrant',
      entityId: id,
      description: `Updated spending on grant "${grant.grantNumber}" by ${dto.spentAmount}. Total spent: ${newTotalSpent}`,
      metadata: {
        grantNumber: grant.grantNumber,
        previousSpent: existing.spentAmount,
        additionalSpending: dto.spentAmount,
        newTotalSpent: newTotalSpent.toString(),
        awardedAmount: existing.awardedAmount,
        remainingAmount: awardedAmount.minus(newTotalSpent).toString(),
        notes: dto.notes,
      },
    });

    return grant;
  }
}
