import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInnovationDto } from './dto/create-innovation.dto';
import { UpdateInnovationDto } from './dto/update-innovation.dto';
import { UpdateInnovationStatusDto } from './dto/update-innovation-status.dto';
import { AuditAction, InnovationStage, InnovationStatus, Prisma, NotificationType, UserRole } from '@prisma/client';

const INNOVATION_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  developmentStage: true,
  status: true,
  researchProjectId: true,
  submittedById: true,
  createdAt: true,
  updatedAt: true,
  researchProject: {
    select: {
      id: true,
      projectCode: true,
      title: true,
      projectStatus: true,
    },
  },
  submittedBy: {
    select: {
      id: true,
      userId: true,
      department: true,
      academicPosition: true,
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
} satisfies Prisma.InnovationSelect;

@Injectable()
export class InnovationsService {
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
    developmentStage?: string;
    category?: string;
    researchProjectId?: string;
    submittedById?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      search,
      status,
      developmentStage,
      category,
      researchProjectId,
      submittedById,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.InnovationWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { submittedBy: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { submittedBy: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { researchProject: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status as InnovationStatus;
    }

    if (developmentStage) {
      where.developmentStage = developmentStage as InnovationStage;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    if (submittedById) {
      where.submittedById = submittedById;
    }

    const [items, total] = await Promise.all([
      this.prisma.innovation.findMany({
        where,
        select: INNOVATION_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.innovation.count({ where }),
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
    const innovation = await this.prisma.innovation.findUnique({
      where: { id },
      select: INNOVATION_SELECT,
    });

    if (!innovation) {
      throw new NotFoundException('Innovation not found');
    }

    return innovation;
  }

  async getSummary() {
    const [
      total,
      submitted,
      underEvaluation,
      approved,
      rejected,
      completed,
      idea,
      prototype,
      testing,
      validated,
      transferred,
    ] = await Promise.all([
      this.prisma.innovation.count(),
      this.prisma.innovation.count({ where: { status: InnovationStatus.SUBMITTED } }),
      this.prisma.innovation.count({ where: { status: InnovationStatus.UNDER_EVALUATION } }),
      this.prisma.innovation.count({ where: { status: InnovationStatus.APPROVED } }),
      this.prisma.innovation.count({ where: { status: InnovationStatus.REJECTED } }),
      this.prisma.innovation.count({ where: { status: InnovationStatus.COMPLETED } }),
      this.prisma.innovation.count({ where: { developmentStage: InnovationStage.IDEA } }),
      this.prisma.innovation.count({ where: { developmentStage: InnovationStage.PROTOTYPE } }),
      this.prisma.innovation.count({ where: { developmentStage: InnovationStage.TESTING } }),
      this.prisma.innovation.count({ where: { developmentStage: InnovationStage.VALIDATED } }),
      this.prisma.innovation.count({ where: { developmentStage: InnovationStage.TRANSFERRED } }),
    ]);

    return {
      total,
      byStatus: { submitted, underEvaluation, approved, rejected, completed },
      byStage: { idea, prototype, testing, validated, transferred },
    };
  }

  async create(dto: CreateInnovationDto, userId: string) {
    const researcher = await this.prisma.researcher.findUnique({
      where: { id: dto.submittedById },
    });

    if (!researcher) {
      throw new NotFoundException('Researcher not found');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });

      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    const innovation = await this.prisma.innovation.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        developmentStage: dto.developmentStage || InnovationStage.IDEA,
        status: dto.status || InnovationStatus.SUBMITTED,
        researchProjectId: dto.researchProjectId || null,
        submittedById: dto.submittedById,
      },
      select: INNOVATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'Innovation',
      entityId: innovation.id,
      description: `Created innovation "${innovation.title}"`,
    });

    const adminCoordinatorIds = [
      ...(await this.notificationsService.findUsersByRole(UserRole.ADMIN)),
      ...(await this.notificationsService.findUsersByRole(UserRole.COORDINATOR)),
    ];
    const uniqueAdminCoordinatorIds = [...new Set(adminCoordinatorIds)];
    const innovationNotificationData = uniqueAdminCoordinatorIds.map((uid) => ({
      userId: uid,
      type: NotificationType.INFO as NotificationType,
      title: 'New Innovation Submitted',
      message: `"${innovation.title}" has been submitted for review.`,
      entityType: 'Innovation' as string,
      entityId: innovation.id as string,
    }));
    await this.notificationsService.createMany(innovationNotificationData);

    return innovation;
  }

  async update(id: string, dto: UpdateInnovationDto, userId: string) {
    const existing = await this.findById(id);

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });

      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    if (dto.title !== undefined || dto.description !== undefined || dto.category !== undefined || dto.developmentStage !== undefined || dto.researchProjectId !== undefined) {
      const data: Prisma.InnovationUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.category !== undefined) data.category = dto.category;
      if (dto.developmentStage !== undefined) data.developmentStage = dto.developmentStage;
      if (dto.researchProjectId !== undefined) {
        data.researchProject = dto.researchProjectId
          ? { connect: { id: dto.researchProjectId } }
          : { disconnect: true };
      }

      const innovation = await this.prisma.innovation.update({
        where: { id },
        data,
        select: INNOVATION_SELECT,
      });

      await this.auditService.log({
        userId,
        action: AuditAction.UPDATE,
        entityType: 'Innovation',
        entityId: id,
        description: `Updated innovation "${innovation.title}"`,
        metadata: { fields: Object.keys(data) },
      });

      return innovation;
    }

    return existing;
  }

  async updateStatus(id: string, dto: UpdateInnovationStatusDto, userId: string) {
    const existing = await this.findById(id);

    const validTransitions: Record<string, InnovationStatus[]> = {
      [InnovationStatus.SUBMITTED]: [InnovationStatus.UNDER_EVALUATION, InnovationStatus.REJECTED],
      [InnovationStatus.UNDER_EVALUATION]: [InnovationStatus.APPROVED, InnovationStatus.REJECTED],
      [InnovationStatus.APPROVED]: [InnovationStatus.COMPLETED],
      [InnovationStatus.REJECTED]: [],
      [InnovationStatus.COMPLETED]: [],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${dto.status}`,
      );
    }

    const innovation = await this.prisma.innovation.update({
      where: { id },
      data: { status: dto.status },
      select: INNOVATION_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Innovation',
      entityId: id,
      description: `Changed innovation status from ${existing.status} to ${dto.status}`,
      metadata: { from: existing.status, to: dto.status },
    });

    const submitterUserIds = await this.notificationsService.findUserIdsByResearcherId(existing.submittedById);
    let innovNotificationType: NotificationType;
    let innovTitle: string;
    let innovMessage: string;

    if (dto.status === InnovationStatus.APPROVED) {
      innovNotificationType = NotificationType.SUCCESS;
      innovTitle = 'Innovation Approved';
      innovMessage = `Your innovation "${existing.title}" has been approved.`;
    } else if (dto.status === InnovationStatus.REJECTED) {
      innovNotificationType = NotificationType.WARNING;
      innovTitle = 'Innovation Rejected';
      innovMessage = `Your innovation "${existing.title}" has been rejected.`;
    } else {
      innovNotificationType = NotificationType.STATUS_CHANGE;
      innovTitle = 'Innovation Status Updated';
      innovMessage = `Your innovation "${existing.title}" status changed to ${dto.status}.`;
    }

    for (const uid of submitterUserIds) {
      await this.notificationsService.create({
        userId: uid,
        type: innovNotificationType,
        title: innovTitle,
        message: innovMessage,
        entityType: 'Innovation',
        entityId: id,
      });
    }

    return innovation;
  }
}
