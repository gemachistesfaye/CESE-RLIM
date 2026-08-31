import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, EthicsApplicationStatus, EthicsReviewDecision, UserRole } from '@prisma/client';
import { CreateEthicsApplicationDto } from './dto/create-ethics-application.dto';
import { UpdateEthicsApplicationDto } from './dto/update-ethics-application.dto';
import { ReviewEthicsApplicationDto } from './dto/review-ethics-application.dto';
import { AssignEthicsReviewerDto } from './dto/assign-ethics-reviewer.dto';

const ETHICS_APPLICATION_SELECT = {
  id: true,
  applicationCode: true,
  researchProjectId: true,
  applicantId: true,
  title: true,
  researchSummary: true,
  methodology: true,
  participantDetails: true,
  riskAssessment: true,
  benefitStatement: true,
  dataProtectionPlan: true,
  consentProcess: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  approvedAt: true,
  rejectedAt: true,
  reviewerId: true,
  reviewComment: true,
  revisionComment: true,
  createdAt: true,
  updatedAt: true,
  researchProject: { select: { id: true, projectCode: true, title: true } },
  applicant: { select: { id: true, userId: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
  reviewer: { select: { id: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
  reviews: {
    select: {
      id: true,
      decision: true,
      comment: true,
      reviewedAt: true,
      reviewer: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  reviewers: {
    select: {
      id: true,
      assignedAt: true,
      isActive: true,
      completedAt: true,
      reviewer: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      assignedBy: { select: { firstName: true, lastName: true } },
    },
    where: { isActive: true },
  },
};

const VALID_TRANSITIONS: Record<EthicsApplicationStatus, EthicsApplicationStatus[]> = {
  DRAFT: [EthicsApplicationStatus.SUBMITTED, EthicsApplicationStatus.WITHDRAWN],
  SUBMITTED: [EthicsApplicationStatus.UNDER_REVIEW, EthicsApplicationStatus.WITHDRAWN],
  UNDER_REVIEW: [EthicsApplicationStatus.APPROVED, EthicsApplicationStatus.REJECTED, EthicsApplicationStatus.REVISION_REQUIRED],
  REVISION_REQUIRED: [EthicsApplicationStatus.RESUBMITTED, EthicsApplicationStatus.WITHDRAWN],
  RESUBMITTED: [EthicsApplicationStatus.UNDER_REVIEW],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

@Injectable()
export class EthicsService {
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
    reviewerId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    userRole?: UserRole;
  }) {
    const { page, limit, search, status, researchProjectId, reviewerId, sortBy = 'createdAt', sortOrder = 'desc', userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status as EthicsApplicationStatus;
    }

    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    if (reviewerId) {
      where.reviewerId = reviewerId;
    }

    if (userId && userRole === UserRole.RESEARCHER) {
      where.applicantId = userId;
    }

    if (search) {
      where.OR = [
        { applicationCode: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { researchSummary: { contains: search, mode: 'insensitive' } },
        { researchProject: { title: { contains: search, mode: 'insensitive' } } },
        { applicant: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { applicant: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    if (sortBy === 'applicationCode' || sortBy === 'title' || sortBy === 'status') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'projectTitle') {
      orderBy.researchProject = { title: sortOrder };
    } else if (sortBy === 'applicantName') {
      orderBy.applicant = { user: { firstName: sortOrder } };
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total] = await Promise.all([
      this.prisma.ethicsApplication.findMany({
        where,
        select: ETHICS_APPLICATION_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.ethicsApplication.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const application = await this.prisma.ethicsApplication.findUnique({
      where: { id },
      select: ETHICS_APPLICATION_SELECT,
    });

    if (!application) {
      throw new NotFoundException('Ethics application not found');
    }

    return application;
  }

  async getMyApplications(params: { userId: string; page: number; limit: number; status?: string }) {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const where: Record<string, unknown> = { applicantId: researcher.id };
    if (status) {
      where.status = status as EthicsApplicationStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.ethicsApplication.findMany({
        where,
        select: ETHICS_APPLICATION_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ethicsApplication.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSummary() {
    const [total, draft, submitted, underReview, revisionRequired, resubmitted, approved, rejected, withdrawn] = await Promise.all([
      this.prisma.ethicsApplication.count(),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.DRAFT } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.SUBMITTED } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.UNDER_REVIEW } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.REVISION_REQUIRED } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.RESUBMITTED } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.APPROVED } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.REJECTED } }),
      this.prisma.ethicsApplication.count({ where: { status: EthicsApplicationStatus.WITHDRAWN } }),
    ]);

    const pendingReview = submitted + underReview + resubmitted;
    const approvalRate = approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;

    return { total, draft, submitted, underReview, revisionRequired, resubmitted, approved, rejected, withdrawn, pendingReview, approvalRate };
  }

  async getOverdue() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const items = await this.prisma.ethicsApplication.findMany({
      where: {
        status: { in: [EthicsApplicationStatus.SUBMITTED, EthicsApplicationStatus.RESUBMITTED] },
        submittedAt: { lte: fourteenDaysAgo },
      },
      select: {
        id: true,
        applicationCode: true,
        title: true,
        status: true,
        submittedAt: true,
        applicant: { select: { user: { select: { firstName: true, lastName: true } } } },
        researchProject: { select: { projectCode: true, title: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });

    return items;
  }

  async getPendingReview() {
    const items = await this.prisma.ethicsApplication.findMany({
      where: {
        status: { in: [EthicsApplicationStatus.SUBMITTED, EthicsApplicationStatus.RESUBMITTED] },
      },
      select: {
        id: true,
        applicationCode: true,
        title: true,
        status: true,
        submittedAt: true,
        applicant: { select: { user: { select: { firstName: true, lastName: true } } } },
        researchProject: { select: { projectCode: true, title: true } },
        reviewers: {
          select: {
            reviewer: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    return items;
  }

  async getByProject(projectId: string) {
    return this.prisma.ethicsApplication.findMany({
      where: { researchProjectId: projectId },
      select: {
        id: true,
        applicationCode: true,
        title: true,
        status: true,
        submittedAt: true,
        approvedAt: true,
        applicant: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByResearcher(researcherId: string) {
    return this.prisma.ethicsApplication.findMany({
      where: { applicantId: researcherId },
      select: {
        id: true,
        applicationCode: true,
        title: true,
        status: true,
        submittedAt: true,
        approvedAt: true,
        researchProject: { select: { projectCode: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateEthicsApplicationDto, userId: string) {
    const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
    if (!project) {
      throw new NotFoundException('Research project not found');
    }

    const count = await this.prisma.ethicsApplication.count();
    const applicationCode = `ETH-${String(count + 1).padStart(4, '0')}`;

    const application = await this.prisma.ethicsApplication.create({
      data: {
        applicationCode,
        researchProjectId: dto.researchProjectId,
        applicantId: researcher.id,
        title: dto.title,
        researchSummary: dto.researchSummary,
        methodology: dto.methodology,
        participantDetails: dto.participantDetails,
        riskAssessment: dto.riskAssessment,
        benefitStatement: dto.benefitStatement,
        dataProtectionPlan: dto.dataProtectionPlan,
        consentProcess: dto.consentProcess,
        status: EthicsApplicationStatus.DRAFT,
      },
      select: ETHICS_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'EthicsApplication',
      entityId: application.id,
      description: `Created ethics application ${applicationCode}`,
      metadata: { applicationCode, researchProjectId: dto.researchProjectId },
    });

    return application;
  }

  async update(id: string, dto: UpdateEthicsApplicationDto, userId: string, userRole: UserRole) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
      if (!researcher || existing.applicantId !== researcher.id) {
        throw new ForbiddenException('You can only edit your own applications');
      }
    }

    if (existing.status !== EthicsApplicationStatus.DRAFT && existing.status !== EthicsApplicationStatus.REVISION_REQUIRED) {
      throw new BadRequestException('Can only edit draft or revision-required applications');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    const application = await this.prisma.ethicsApplication.update({
      where: { id },
      data: {
        ...(dto.researchProjectId && { researchProjectId: dto.researchProjectId }),
        ...(dto.title && { title: dto.title }),
        ...(dto.researchSummary && { researchSummary: dto.researchSummary }),
        ...(dto.methodology !== undefined && { methodology: dto.methodology }),
        ...(dto.participantDetails !== undefined && { participantDetails: dto.participantDetails }),
        ...(dto.riskAssessment !== undefined && { riskAssessment: dto.riskAssessment }),
        ...(dto.benefitStatement !== undefined && { benefitStatement: dto.benefitStatement }),
        ...(dto.dataProtectionPlan !== undefined && { dataProtectionPlan: dto.dataProtectionPlan }),
        ...(dto.consentProcess !== undefined && { consentProcess: dto.consentProcess }),
      },
      select: ETHICS_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'EthicsApplication',
      entityId: id,
      description: `Updated ethics application ${existing.applicationCode}`,
      metadata: { applicationCode: existing.applicationCode, changedFields: Object.keys(dto).filter(k => dto[k as keyof UpdateEthicsApplicationDto] !== undefined) },
    });

    return application;
  }

  async submit(id: string, userId: string) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
    if (!researcher || existing.applicantId !== researcher.id) {
      throw new ForbiddenException('You can only submit your own applications');
    }

    const allowedStatuses: EthicsApplicationStatus[] = [EthicsApplicationStatus.DRAFT, EthicsApplicationStatus.REVISION_REQUIRED];
    if (!allowedStatuses.includes(existing.status as EthicsApplicationStatus)) {
      throw new BadRequestException(`Cannot submit application in ${existing.status} status`);
    }

    if (!existing.title || !existing.researchSummary) {
      throw new BadRequestException('Title and research summary are required for submission');
    }

    const newStatus = existing.status === EthicsApplicationStatus.REVISION_REQUIRED
      ? EthicsApplicationStatus.RESUBMITTED
      : EthicsApplicationStatus.SUBMITTED;

    const application = await this.prisma.ethicsApplication.update({
      where: { id },
      data: {
        status: newStatus,
        submittedAt: new Date(),
        revisionComment: existing.status === EthicsApplicationStatus.REVISION_REQUIRED ? null : existing.revisionComment,
      },
      select: ETHICS_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.SUBMIT,
      entityType: 'EthicsApplication',
      entityId: id,
      description: `Submitted ethics application ${existing.applicationCode}`,
      metadata: { applicationCode: existing.applicationCode, previousStatus: existing.status, newStatus },
    });

    return application;
  }

  async withdraw(id: string, userId: string) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
    if (!researcher || existing.applicantId !== researcher.id) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    const allowedStatuses: EthicsApplicationStatus[] = [EthicsApplicationStatus.DRAFT, EthicsApplicationStatus.SUBMITTED, EthicsApplicationStatus.REVISION_REQUIRED];
    if (!allowedStatuses.includes(existing.status as EthicsApplicationStatus)) {
      throw new BadRequestException(`Cannot withdraw application in ${existing.status} status`);
    }

    const application = await this.prisma.ethicsApplication.update({
      where: { id },
      data: { status: EthicsApplicationStatus.WITHDRAWN },
      select: ETHICS_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.WITHDRAW,
      entityType: 'EthicsApplication',
      entityId: id,
      description: `Withdrew ethics application ${existing.applicationCode}`,
      metadata: { applicationCode: existing.applicationCode, previousStatus: existing.status },
    });

    return application;
  }

  async review(id: string, dto: ReviewEthicsApplicationDto, userId: string) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    const reviewer = await this.prisma.researcher.findUnique({ where: { userId } });
    if (!reviewer) {
      throw new NotFoundException('Reviewer profile not found');
    }

    if (existing.applicantId === reviewer.id) {
      throw new ForbiddenException('Reviewers cannot review their own application');
    }

    const reviewableStatuses: EthicsApplicationStatus[] = [EthicsApplicationStatus.SUBMITTED, EthicsApplicationStatus.UNDER_REVIEW, EthicsApplicationStatus.RESUBMITTED];
    if (!reviewableStatuses.includes(existing.status as EthicsApplicationStatus)) {
      throw new BadRequestException(`Cannot review application in ${existing.status} status`);
    }

    if (dto.decision === EthicsReviewDecision.REJECT && !dto.comment) {
      throw new BadRequestException('Rejection requires a comment');
    }

    if (dto.decision === EthicsReviewDecision.REQUEST_REVISION && !dto.comment) {
      throw new BadRequestException('Revision request requires feedback');
    }

    let newStatus: EthicsApplicationStatus;
    switch (dto.decision) {
      case EthicsReviewDecision.APPROVE:
        newStatus = EthicsApplicationStatus.APPROVED;
        break;
      case EthicsReviewDecision.REJECT:
        newStatus = EthicsApplicationStatus.REJECTED;
        break;
      case EthicsReviewDecision.REQUEST_REVISION:
        newStatus = EthicsApplicationStatus.REVISION_REQUIRED;
        break;
    }

    const [application] = await this.prisma.$transaction([
      this.prisma.ethicsApplication.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          approvedAt: dto.decision === EthicsReviewDecision.APPROVE ? new Date() : null,
          rejectedAt: dto.decision === EthicsReviewDecision.REJECT ? new Date() : null,
          reviewerId: reviewer.id,
          reviewComment: dto.comment || null,
          revisionComment: dto.decision === EthicsReviewDecision.REQUEST_REVISION ? dto.comment : existing.revisionComment,
        },
        select: ETHICS_APPLICATION_SELECT,
      }),
      this.prisma.ethicsReview.create({
        data: {
          applicationId: id,
          reviewerId: reviewer.id,
          decision: dto.decision,
          comment: dto.comment,
        },
      }),
    ]);

    const actionMap: Record<EthicsReviewDecision, AuditAction> = {
      [EthicsReviewDecision.APPROVE]: AuditAction.APPROVE,
      [EthicsReviewDecision.REJECT]: AuditAction.REJECT,
      [EthicsReviewDecision.REQUEST_REVISION]: AuditAction.REQUEST_REVISION,
    };

    await this.auditService.log({
      userId,
      action: actionMap[dto.decision],
      entityType: 'EthicsApplication',
      entityId: id,
      description: `${dto.decision.toLowerCase().replace('_', ' ')} ethics application ${existing.applicationCode}`,
      metadata: { applicationCode: existing.applicationCode, decision: dto.decision, previousStatus: existing.status, newStatus, comment: dto.comment },
    });

    return application;
  }

  async assignReviewer(id: string, dto: AssignEthicsReviewerDto, userId: string) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    const reviewableStatuses: EthicsApplicationStatus[] = [EthicsApplicationStatus.SUBMITTED, EthicsApplicationStatus.UNDER_REVIEW, EthicsApplicationStatus.RESUBMITTED];
    if (!reviewableStatuses.includes(existing.status as EthicsApplicationStatus)) {
      throw new BadRequestException(`Cannot assign reviewer to application in ${existing.status} status`);
    }

    const reviewerResearcher = await this.prisma.researcher.findUnique({ where: { id: dto.reviewerId } });
    if (!reviewerResearcher) {
      throw new NotFoundException('Reviewer not found');
    }

    if (existing.applicantId === dto.reviewerId) {
      throw new ForbiddenException('Cannot assign the applicant as reviewer');
    }

    const existingAssignment = await this.prisma.ethicsReviewer.findUnique({
      where: { applicationId_reviewerId: { applicationId: id, reviewerId: dto.reviewerId } },
    });

    if (existingAssignment && existingAssignment.isActive) {
      throw new ConflictException('Reviewer already assigned to this application');
    }

    const [, application] = await this.prisma.$transaction([
      existingAssignment
        ? this.prisma.ethicsReviewer.update({
            where: { id: existingAssignment.id },
            data: { isActive: true, completedAt: null },
          })
        : this.prisma.ethicsReviewer.create({
            data: {
              applicationId: id,
              reviewerId: dto.reviewerId,
              assignedById: userId,
            },
          }),
      this.prisma.ethicsApplication.update({
        where: { id },
        data: {
          status: EthicsApplicationStatus.UNDER_REVIEW,
          reviewerId: reviewerResearcher.id,
        },
        select: ETHICS_APPLICATION_SELECT,
      }),
    ]);

    await this.auditService.log({
      userId,
      action: AuditAction.ASSIGN_REVIEWER,
      entityType: 'EthicsApplication',
      entityId: id,
      description: `Assigned reviewer to ethics application ${existing.applicationCode}`,
      metadata: { applicationCode: existing.applicationCode, reviewerId: dto.reviewerId, previousStatus: existing.status },
    });

    return application;
  }

  async removeReviewer(id: string, reviewerId: string, userId: string) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    const assignment = await this.prisma.ethicsReviewer.findUnique({
      where: { applicationId_reviewerId: { applicationId: id, reviewerId } },
    });

    if (!assignment || !assignment.isActive) {
      throw new NotFoundException('Active reviewer assignment not found');
    }

    await this.prisma.ethicsReviewer.update({
      where: { id: assignment.id },
      data: { isActive: false, completedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'EthicsApplication',
      entityId: id,
      description: `Removed reviewer from ethics application ${existing.applicationCode}`,
      metadata: { applicationCode: existing.applicationCode, reviewerId },
    });

    return this.findById(id);
  }

  async updateStatus(id: string, newStatus: EthicsApplicationStatus, userId: string) {
    const existing = await this.prisma.ethicsApplication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Ethics application not found');
    }

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${newStatus}`);
    }

    const application = await this.prisma.ethicsApplication.update({
      where: { id },
      data: { status: newStatus },
      select: ETHICS_APPLICATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'EthicsApplication',
      entityId: id,
      description: `Changed ethics application ${existing.applicationCode} status to ${newStatus}`,
      metadata: { applicationCode: existing.applicationCode, previousStatus: existing.status, newStatus },
    });

    return application;
  }
}
