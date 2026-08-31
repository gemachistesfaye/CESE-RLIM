import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ResearchReportStatus, ResearchReportType, Prisma, UserRole } from '@prisma/client';
import { CreateResearchReportDto } from './dto/create-research-report.dto';
import { UpdateResearchReportDto } from './dto/update-research-report.dto';

const REPORT_SELECT = {
  id: true,
  reportCode: true,
  title: true,
  reportType: true,
  researchProjectId: true,
  submittedById: true,
  reportingPeriodStart: true,
  reportingPeriodEnd: true,
  submittedAt: true,
  status: true,
  executiveSummary: true,
  objectives: true,
  methodology: true,
  achievements: true,
  challenges: true,
  findings: true,
  recommendations: true,
  conclusion: true,
  progressPercentage: true,
  nextPeriodPlan: true,
  reviewerId: true,
  reviewComment: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  researchProject: { select: { id: true, projectCode: true, title: true } },
  submittedBy: { select: { id: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
  reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.ResearchReportSelect;

const VALID_TRANSITIONS: Record<ResearchReportStatus, ResearchReportStatus[]> = {
  DRAFT: [ResearchReportStatus.SUBMITTED, ResearchReportStatus.WITHDRAWN],
  SUBMITTED: [ResearchReportStatus.UNDER_REVIEW, ResearchReportStatus.WITHDRAWN],
  UNDER_REVIEW: [ResearchReportStatus.APPROVED, ResearchReportStatus.REVISION_REQUIRED, ResearchReportStatus.REJECTED],
  APPROVED: [],
  REVISION_REQUIRED: [ResearchReportStatus.SUBMITTED],
  REJECTED: [ResearchReportStatus.SUBMITTED],
  RESUBMITTED: [ResearchReportStatus.UNDER_REVIEW],
  WITHDRAWN: [ResearchReportStatus.DRAFT],
};

function generateReportCode(type: string): string {
  const prefix = type.replace('_', '');
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${y}${m}${d}-${rand}`;
}

@Injectable()
export class ResearchReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number; limit: number; search?: string; status?: string; reportType?: string;
    researchProjectId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
    userId?: string; userRole?: UserRole;
  }) {
    const { page, limit, search, status, reportType, researchProjectId, sortBy = 'createdAt', sortOrder = 'desc', userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status as ResearchReportStatus;
    if (reportType) where.reportType = reportType as ResearchReportType;
    if (researchProjectId) where.researchProjectId = researchProjectId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reportCode: { contains: search, mode: 'insensitive' } },
        { researchProject: { title: { contains: search, mode: 'insensitive' } } },
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
    const validSorts = ['title', 'reportCode', 'status', 'reportType', 'progressPercentage', 'submittedAt', 'createdAt'];
    if (validSorts.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.researchReport.findMany({ where, select: REPORT_SELECT, skip, take: limit, orderBy }),
      this.prisma.researchReport.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const report = await this.prisma.researchReport.findUnique({ where: { id }, select: REPORT_SELECT });
    if (!report) throw new NotFoundException('Research report not found');
    return report;
  }

  async findByProject(projectId: string) {
    return this.prisma.researchReport.findMany({
      where: { researchProjectId: projectId },
      select: REPORT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyReports(params: { userId: string; page: number; limit: number; status?: string }) {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher) throw new NotFoundException('Researcher profile not found');

    const where: Record<string, unknown> = { submittedById: researcher.id };
    if (status) where.status = status as ResearchReportStatus;

    const [items, total] = await Promise.all([
      this.prisma.researchReport.findMany({ where, select: REPORT_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.researchReport.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findByReviewer(reviewerId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { reviewerId };
    if (status) where.status = status as ResearchReportStatus;
    else where.status = { in: [ResearchReportStatus.SUBMITTED, ResearchReportStatus.UNDER_REVIEW, ResearchReportStatus.RESUBMITTED] };

    const [items, total] = await Promise.all([
      this.prisma.researchReport.findMany({ where, select: REPORT_SELECT, skip, take: limit, orderBy: { submittedAt: 'asc' } }),
      this.prisma.researchReport.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSummary() {
    const [total, draft, submitted, underReview, approved, revisionRequired, rejected] = await Promise.all([
      this.prisma.researchReport.count(),
      this.prisma.researchReport.count({ where: { status: ResearchReportStatus.DRAFT } }),
      this.prisma.researchReport.count({ where: { status: ResearchReportStatus.SUBMITTED } }),
      this.prisma.researchReport.count({ where: { status: ResearchReportStatus.UNDER_REVIEW } }),
      this.prisma.researchReport.count({ where: { status: ResearchReportStatus.APPROVED } }),
      this.prisma.researchReport.count({ where: { status: ResearchReportStatus.REVISION_REQUIRED } }),
      this.prisma.researchReport.count({ where: { status: ResearchReportStatus.REJECTED } }),
    ]);

    const byType = await this.prisma.researchReport.groupBy({ by: ['reportType'], _count: { id: true } });
    const typeBreakdown = Object.fromEntries(byType.map(t => [t.reportType, t._count.id]));

    return { total, draft, submitted, underReview, approved, revisionRequired, rejected, byType: typeBreakdown };
  }

  async create(dto: CreateResearchReportDto, userId: string) {
    const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
    if (!project) throw new NotFoundException('Research project not found');

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher) throw new NotFoundException('Researcher profile not found');

    if (dto.reportingPeriodStart && dto.reportingPeriodEnd && new Date(dto.reportingPeriodEnd) < new Date(dto.reportingPeriodStart)) {
      throw new BadRequestException('Reporting period end date cannot be before start date');
    }

    const reportCode = generateReportCode(dto.reportType);

    const report = await this.prisma.researchReport.create({
      data: {
        reportCode,
        title: dto.title,
        reportType: dto.reportType,
        researchProjectId: dto.researchProjectId,
        submittedById: researcher.id,
        reportingPeriodStart: dto.reportingPeriodStart ? new Date(dto.reportingPeriodStart) : null,
        reportingPeriodEnd: dto.reportingPeriodEnd ? new Date(dto.reportingPeriodEnd) : null,
        executiveSummary: dto.executiveSummary,
        objectives: dto.objectives,
        methodology: dto.methodology,
        achievements: dto.achievements,
        challenges: dto.challenges,
        findings: dto.findings,
        recommendations: dto.recommendations,
        conclusion: dto.conclusion,
        progressPercentage: dto.progressPercentage,
        nextPeriodPlan: dto.nextPeriodPlan,
        status: ResearchReportStatus.DRAFT,
      },
      select: REPORT_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.CREATE, entityType: 'ResearchReport',
      entityId: report.id, description: `Created report "${dto.title}" (${reportCode})`,
      metadata: { researchProjectId: dto.researchProjectId, reportType: dto.reportType, reportCode },
    });

    return report;
  }

  async update(id: string, dto: UpdateResearchReportDto, userId: string) {
    const existing = await this.prisma.researchReport.findUnique({ where: { id }, select: { id: true, status: true, title: true } });
    if (!existing) throw new NotFoundException('Research report not found');

    if (existing.status !== ResearchReportStatus.DRAFT && existing.status !== ResearchReportStatus.REVISION_REQUIRED) {
      throw new BadRequestException('Can only edit reports in DRAFT or REVISION_REQUIRED status');
    }

    if (dto.reportingPeriodStart && dto.reportingPeriodEnd && new Date(dto.reportingPeriodEnd) < new Date(dto.reportingPeriodStart)) {
      throw new BadRequestException('Reporting period end date cannot be before start date');
    }

    const report = await this.prisma.researchReport.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.reportType && { reportType: dto.reportType }),
        ...(dto.reportingPeriodStart !== undefined && { reportingPeriodStart: dto.reportingPeriodStart ? new Date(dto.reportingPeriodStart) : null }),
        ...(dto.reportingPeriodEnd !== undefined && { reportingPeriodEnd: dto.reportingPeriodEnd ? new Date(dto.reportingPeriodEnd) : null }),
        ...(dto.executiveSummary !== undefined && { executiveSummary: dto.executiveSummary }),
        ...(dto.objectives !== undefined && { objectives: dto.objectives }),
        ...(dto.methodology !== undefined && { methodology: dto.methodology }),
        ...(dto.achievements !== undefined && { achievements: dto.achievements }),
        ...(dto.challenges !== undefined && { challenges: dto.challenges }),
        ...(dto.findings !== undefined && { findings: dto.findings }),
        ...(dto.recommendations !== undefined && { recommendations: dto.recommendations }),
        ...(dto.conclusion !== undefined && { conclusion: dto.conclusion }),
        ...(dto.progressPercentage !== undefined && { progressPercentage: dto.progressPercentage }),
        ...(dto.nextPeriodPlan !== undefined && { nextPeriodPlan: dto.nextPeriodPlan }),
      },
      select: REPORT_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.UPDATE, entityType: 'ResearchReport',
      entityId: id, description: `Updated report "${report.title}"`,
      metadata: { changedFields: Object.keys(dto).filter(k => dto[k as keyof UpdateResearchReportDto] !== undefined) },
    });

    return report;
  }

  async updateStatus(id: string, newStatus: ResearchReportStatus, userId: string, reviewComment?: string) {
    const existing = await this.prisma.researchReport.findUnique({
      where: { id }, select: { id: true, status: true, title: true, reportCode: true },
    });
    if (!existing) throw new NotFoundException('Research report not found');

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${newStatus}`);
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === ResearchReportStatus.SUBMITTED && existing.status === ResearchReportStatus.DRAFT) {
      updateData.submittedAt = new Date();
    }

    if (newStatus === ResearchReportStatus.UNDER_REVIEW || newStatus === ResearchReportStatus.APPROVED || newStatus === ResearchReportStatus.REVISION_REQUIRED || newStatus === ResearchReportStatus.REJECTED) {
      updateData.reviewedAt = new Date();
      if (reviewComment !== undefined) updateData.reviewComment = reviewComment;
    }

    const report = await this.prisma.researchReport.update({
      where: { id }, data: updateData, select: REPORT_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.STATUS_CHANGE, entityType: 'ResearchReport',
      entityId: id, description: `Changed report "${existing.title}" (${existing.reportCode}) status to ${newStatus}`,
      metadata: { previousStatus: existing.status, newStatus, reportCode: existing.reportCode },
    });

    return report;
  }

  async submit(id: string, userId: string) {
    return this.updateStatus(id, ResearchReportStatus.SUBMITTED, userId);
  }

  async submitForReview(id: string, reviewerId: string, userId: string) {
    const reviewer = await this.prisma.user.findUnique({ where: { id: reviewerId }, select: { id: true, role: true } });
    if (!reviewer) throw new NotFoundException('Reviewer not found');

    const report = await this.prisma.researchReport.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!report) throw new NotFoundException('Research report not found');

    const allowed = VALID_TRANSITIONS[report.status];
    if (!allowed.includes(ResearchReportStatus.UNDER_REVIEW)) {
      throw new BadRequestException(`Cannot submit for review from ${report.status} status`);
    }

    const updated = await this.prisma.researchReport.update({
      where: { id },
      data: {
        status: ResearchReportStatus.UNDER_REVIEW,
        reviewerId,
        submittedAt: report.status === ResearchReportStatus.DRAFT ? new Date() : undefined,
      },
      select: REPORT_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.STATUS_CHANGE, entityType: 'ResearchReport',
      entityId: id, description: `Submitted report for review, assigned to reviewer`,
      metadata: { reviewerId, newStatus: ResearchReportStatus.UNDER_REVIEW },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.researchReport.findUnique({ where: { id }, select: { id: true, title: true, status: true, reportCode: true } });
    if (!existing) throw new NotFoundException('Research report not found');

    if (existing.status !== ResearchReportStatus.DRAFT && existing.status !== ResearchReportStatus.WITHDRAWN) {
      throw new BadRequestException('Can only delete reports in DRAFT or WITHDRAWN status');
    }

    await this.prisma.researchReport.delete({ where: { id } });

    await this.auditService.log({
      userId, action: AuditAction.DELETE, entityType: 'ResearchReport',
      entityId: id, description: `Deleted report "${existing.title}" (${existing.reportCode})`,
      metadata: { title: existing.title, reportCode: existing.reportCode, status: existing.status },
    });

    return { message: 'Report deleted' };
  }
}
