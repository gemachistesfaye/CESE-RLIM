import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGrantApplicationDto } from './dto/create-grant-application.dto';
import { UpdateGrantApplicationDto } from './dto/update-grant-application.dto';
import { ReviewGrantApplicationDto, ReviewDecision } from './dto/review-grant-application.dto';
import {
  AuditAction,
  GrantApplicationStatus,
  Prisma,
  UserRole,
  NotificationType,
} from '@prisma/client';

const GRANT_APPLICATION_SELECT = {
  id: true,
  opportunityId: true,
  researchProjectId: true,
  applicantId: true,
  title: true,
  requestedAmount: true,
  proposalSummary: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedById: true,
  reviewComment: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  opportunity: {
    select: {
      id: true,
      title: true,
      fundingType: true,
      status: true,
      applicationDeadline: true,
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
  applicant: {
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
  reviewedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  grant: {
    select: {
      id: true,
      grantNumber: true,
      status: true,
    },
  },
} satisfies Prisma.GrantApplicationSelect;

const VALID_TRANSITIONS: Record<GrantApplicationStatus, GrantApplicationStatus[]> = {
  [GrantApplicationStatus.DRAFT]: [GrantApplicationStatus.SUBMITTED],
  [GrantApplicationStatus.SUBMITTED]: [
    GrantApplicationStatus.UNDER_REVIEW,
    GrantApplicationStatus.APPROVED,
    GrantApplicationStatus.REJECTED,
    GrantApplicationStatus.WITHDRAWN,
  ],
  [GrantApplicationStatus.UNDER_REVIEW]: [
    GrantApplicationStatus.APPROVED,
    GrantApplicationStatus.REJECTED,
    GrantApplicationStatus.WITHDRAWN,
  ],
  [GrantApplicationStatus.APPROVED]: [],
  [GrantApplicationStatus.REJECTED]: [],
  [GrantApplicationStatus.WITHDRAWN]: [],
};

@Injectable()
export class GrantApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    opportunityId?: string;
    applicantId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userRole?: UserRole;
    userId?: string;
  }) {
    const {
      page,
      limit,
      search,
      status,
      opportunityId,
      applicantId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userRole,
      userId,
    } = params;

    const where: Prisma.GrantApplicationWhereInput = {};

    if (userRole === UserRole.RESEARCHER && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (researcher) {
        where.applicantId = researcher.id;
      } else {
        where.id = '__none__';
      }
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { proposalSummary: { contains: search, mode: 'insensitive' as const } },
          { opportunity: { title: { contains: search, mode: 'insensitive' as const } } },
          {
            applicant: {
              user: {
                firstName: { contains: search, mode: 'insensitive' as const },
              },
            },
          },
          {
            applicant: {
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
      where.status = status as GrantApplicationStatus;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    if (applicantId) {
      where.applicantId = applicantId;
    }

    const [items, total] = await Promise.all([
      this.prisma.grantApplication.findMany({
        where,
        select: GRANT_APPLICATION_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.grantApplication.count({ where }),
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
    const application = await this.prisma.grantApplication.findUnique({
      where: { id },
      select: GRANT_APPLICATION_SELECT,
    });

    if (!application) {
      throw new NotFoundException('Grant application not found');
    }

    return application;
  }

  async getSummary(opportunityId?: string) {
    const where: Prisma.GrantApplicationWhereInput = {};
    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    const [
      total,
      draft,
      submitted,
      underReview,
      approved,
      rejected,
      withdrawn,
    ] = await Promise.all([
      this.prisma.grantApplication.count({ where }),
      this.prisma.grantApplication.count({ where: { ...where, status: GrantApplicationStatus.DRAFT } }),
      this.prisma.grantApplication.count({ where: { ...where, status: GrantApplicationStatus.SUBMITTED } }),
      this.prisma.grantApplication.count({ where: { ...where, status: GrantApplicationStatus.UNDER_REVIEW } }),
      this.prisma.grantApplication.count({ where: { ...where, status: GrantApplicationStatus.APPROVED } }),
      this.prisma.grantApplication.count({ where: { ...where, status: GrantApplicationStatus.REJECTED } }),
      this.prisma.grantApplication.count({ where: { ...where, status: GrantApplicationStatus.WITHDRAWN } }),
    ]);

    const approvalRate = (approved + rejected) > 0
      ? Math.round((approved / (approved + rejected)) * 100)
      : 0;

    return {
      total,
      draft,
      submitted,
      underReview,
      approved,
      rejected,
      withdrawn,
      approvalRate,
    };
  }

  async getMyApplications(userId: string, params: {
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

    const where: Prisma.GrantApplicationWhereInput = {
      applicantId: researcher.id,
    };

    if (status) {
      where.status = status as GrantApplicationStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.grantApplication.findMany({
        where,
        select: GRANT_APPLICATION_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.grantApplication.count({ where }),
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

  async create(dto: CreateGrantApplicationDto, userId: string, userRole: UserRole) {
    const opportunity = await this.prisma.fundingOpportunity.findUnique({
      where: { id: dto.opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('Funding opportunity not found');
    }

    let applicantId: string;

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher) {
        throw new ForbiddenException('Researcher profile not found');
      }
      applicantId = researcher.id;
    } else {
      const researcher = await this.prisma.researcher.findFirst({
        select: { id: true },
      });
      if (!researcher) {
        const firstUser = await this.prisma.user.findFirst({
          where: { role: UserRole.RESEARCHER },
          select: { id: true },
        });
        if (!firstUser) throw new ForbiddenException('No researcher found to assign application to');
        const newResearcher = await this.prisma.researcher.create({
          data: { userId: firstUser.id, department: 'General', employeeOrStudentId: 'ADMIN-' + Date.now() },
        });
        applicantId = newResearcher.id;
      } else {
        applicantId = researcher.id;
      }
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    const application = await this.prisma.grantApplication.create({
      data: {
        opportunityId: dto.opportunityId,
        researchProjectId: dto.researchProjectId || null,
        applicantId,
        title: dto.title.trim(),
        requestedAmount: dto.requestedAmount,
        proposalSummary: dto.proposalSummary.trim(),
        status: GrantApplicationStatus.DRAFT,
      },
      select: GRANT_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'GrantApplication',
      entityId: application.id,
      description: `Created grant application "${application.title}"`,
      metadata: {
        opportunityId: dto.opportunityId,
        researchProjectId: dto.researchProjectId,
        requestedAmount: dto.requestedAmount,
        status: application.status,
      },
    });

    return application;
  }

  async update(id: string, dto: UpdateGrantApplicationDto, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher || existing.applicantId !== researcher.id) {
        throw new ForbiddenException('You can only update your own applications');
      }
      if (existing.status !== GrantApplicationStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT applications can be updated');
      }
    }

    if (dto.opportunityId) {
      const opportunity = await this.prisma.fundingOpportunity.findUnique({
        where: { id: dto.opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException('Funding opportunity not found');
      }
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    const application = await this.prisma.grantApplication.update({
      where: { id },
      data: {
        opportunityId: dto.opportunityId,
        researchProjectId: dto.researchProjectId !== undefined ? dto.researchProjectId : undefined,
        title: dto.title?.trim(),
        requestedAmount: dto.requestedAmount,
        proposalSummary: dto.proposalSummary?.trim(),
      },
      select: GRANT_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'GrantApplication',
      entityId: id,
      description: `Updated grant application "${application.title}"`,
      metadata: {
        changes: dto,
      },
    });

    return application;
  }

  async submit(id: string, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher || existing.applicantId !== researcher.id) {
        throw new ForbiddenException('You can only submit your own applications');
      }
    }

    const allowedTransitions = VALID_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(GrantApplicationStatus.SUBMITTED)) {
      throw new BadRequestException(
        `Cannot submit application in ${existing.status} status`,
      );
    }

    const application = await this.prisma.grantApplication.update({
      where: { id },
      data: {
        status: GrantApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      select: GRANT_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'GrantApplication',
      entityId: id,
      description: `Submitted grant application "${application.title}"`,
      metadata: {
        previousStatus: existing.status,
        newStatus: GrantApplicationStatus.SUBMITTED,
      },
    });

    const submitAdminCoordinatorIds = [
      ...(await this.notificationsService.findUsersByRole(UserRole.ADMIN)),
      ...(await this.notificationsService.findUsersByRole(UserRole.COORDINATOR)),
    ];
    const uniqueSubmitIds = [...new Set(submitAdminCoordinatorIds)];
    const submitNotificationData = uniqueSubmitIds.map((uid) => ({
      userId: uid,
      type: NotificationType.ACTION_REQUIRED as NotificationType,
      title: 'New Grant Application',
      message: `A grant application for "${application.title}" has been submitted.`,
      entityType: 'GrantApplication' as string,
      entityId: id as string,
    }));
    await this.notificationsService.createMany(submitNotificationData);

    return application;
  }

  async review(id: string, dto: ReviewGrantApplicationDto, userId: string) {
    const existing = await this.findById(id);

    if (existing.status !== GrantApplicationStatus.SUBMITTED &&
        existing.status !== GrantApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Cannot review application in ${existing.status} status. Only SUBMITTED or UNDER_REVIEW applications can be reviewed.`,
      );
    }

    if (dto.decision === ReviewDecision.REJECT && !dto.reviewComment) {
      throw new BadRequestException('Rejection requires a review comment');
    }

    const newStatus = dto.decision === ReviewDecision.APPROVE
      ? GrantApplicationStatus.APPROVED
      : GrantApplicationStatus.REJECTED;

    const allowedTransitions = VALID_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${newStatus}`,
      );
    }

    const application = await this.prisma.grantApplication.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedById: (await this.prisma.user.findFirst({
          where: {
            researcher: { userId },
          },
          select: { id: true },
        }))?.id || userId,
        reviewComment: dto.reviewComment?.trim() || null,
      },
      select: GRANT_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: dto.decision === ReviewDecision.APPROVE ? AuditAction.APPROVE : AuditAction.REJECT,
      entityType: 'GrantApplication',
      entityId: id,
      description: `${dto.decision === ReviewDecision.APPROVE ? 'Approved' : 'Rejected'} grant application "${application.title}"`,
      metadata: {
        previousStatus: existing.status,
        newStatus,
        reviewComment: dto.reviewComment,
      },
    });

    const applicantUserIds = await this.notificationsService.findUserIdsByResearcherId(existing.applicantId);
    let grantNotificationType: NotificationType;
    let grantTitle: string;
    let grantMessage: string;

    if (dto.decision === ReviewDecision.APPROVE) {
      grantNotificationType = NotificationType.SUCCESS;
      grantTitle = 'Grant Application Approved';
      grantMessage = `Your application for "${existing.title}" has been approved.`;
    } else {
      grantNotificationType = NotificationType.WARNING;
      grantTitle = 'Grant Application Rejected';
      grantMessage = `Your application for "${existing.title}" has been rejected.`;
    }

    for (const uid of applicantUserIds) {
      await this.notificationsService.create({
        userId: uid,
        type: grantNotificationType,
        title: grantTitle,
        message: grantMessage,
        entityType: 'GrantApplication',
        entityId: id,
      });
    }

    return application;
  }

  async withdraw(id: string, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher || existing.applicantId !== researcher.id) {
        throw new ForbiddenException('You can only withdraw your own applications');
      }
    }

    if (existing.status !== GrantApplicationStatus.SUBMITTED &&
        existing.status !== GrantApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Cannot withdraw application in ${existing.status} status. Only SUBMITTED or UNDER_REVIEW applications can be withdrawn.`,
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(GrantApplicationStatus.WITHDRAWN)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${GrantApplicationStatus.WITHDRAWN}`,
      );
    }

    const application = await this.prisma.grantApplication.update({
      where: { id },
      data: {
        status: GrantApplicationStatus.WITHDRAWN,
      },
      select: GRANT_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.WITHDRAW,
      entityType: 'GrantApplication',
      entityId: id,
      description: `Withdrew grant application "${application.title}"`,
      metadata: {
        previousStatus: existing.status,
        newStatus: GrantApplicationStatus.WITHDRAWN,
      },
    });

    const withdrawAdminCoordinatorIds = [
      ...(await this.notificationsService.findUsersByRole(UserRole.ADMIN)),
      ...(await this.notificationsService.findUsersByRole(UserRole.COORDINATOR)),
    ];
    const uniqueWithdrawIds = [...new Set(withdrawAdminCoordinatorIds)];
    const withdrawNotificationData = uniqueWithdrawIds.map((uid) => ({
      userId: uid,
      type: NotificationType.INFO as NotificationType,
      title: 'Grant Application Withdrawn',
      message: `Application for "${existing.title}" has been withdrawn.`,
      entityType: 'GrantApplication' as string,
      entityId: id as string,
    }));
    await this.notificationsService.createMany(withdrawNotificationData);

    return application;
  }
}
