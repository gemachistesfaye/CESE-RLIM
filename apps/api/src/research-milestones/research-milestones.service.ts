import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditAction, MilestoneStatus, NotificationType, Prisma, UserRole } from '@prisma/client';
import { CreateResearchMilestoneDto } from './dto/create-research-milestone.dto';
import { UpdateResearchMilestoneDto } from './dto/update-research-milestone.dto';

const MILESTONE_SELECT = {
  id: true,
  researchProjectId: true,
  title: true,
  description: true,
  milestoneOrder: true,
  plannedStartDate: true,
  plannedDueDate: true,
  actualCompletionDate: true,
  status: true,
  progress: true,
  responsibleMemberId: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  researchProject: { select: { id: true, projectCode: true, title: true, startDate: true, endDate: true } },
  responsibleMember: { select: { id: true, researcher: { select: { id: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } } } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ResearchMilestoneSelect;

const VALID_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  PLANNED: [MilestoneStatus.IN_PROGRESS, MilestoneStatus.CANCELLED],
  IN_PROGRESS: [MilestoneStatus.BLOCKED, MilestoneStatus.COMPLETED],
  BLOCKED: [MilestoneStatus.IN_PROGRESS, MilestoneStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ResearchMilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(params: {
    page: number; limit: number; search?: string; status?: string;
    researchProjectId?: string; responsibleMemberId?: string;
    overdue?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
    userId?: string; userRole?: UserRole;
  }) {
    const { page, limit, search, status, researchProjectId, responsibleMemberId, overdue, sortBy = 'createdAt', sortOrder = 'desc', userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status as MilestoneStatus;
    if (researchProjectId) where.researchProjectId = researchProjectId;
    if (responsibleMemberId) where.responsibleMemberId = responsibleMemberId;

    if (overdue === 'true') {
      where.plannedDueDate = { lt: new Date() };
      where.status = { notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED] };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { researchProject: { title: { contains: search, mode: 'insensitive' } } },
        { researchProject: { projectCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (userId && userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
      if (researcher) {
        const memberships = await this.prisma.projectMember.findMany({
          where: { researcherId: researcher.id, isActive: true },
          select: { researchProjectId: true },
        });
        const projectIds = memberships.map(m => m.researchProjectId);
        where.researchProjectId = { in: projectIds };
      } else {
        where.id = '__nonexistent__';
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    if (['title', 'status', 'progress', 'milestoneOrder', 'plannedDueDate', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.milestoneOrder = 'asc';
    }

    const [items, total] = await Promise.all([
      this.prisma.researchMilestone.findMany({ where, select: MILESTONE_SELECT, skip, take: limit, orderBy }),
      this.prisma.researchMilestone.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const milestone = await this.prisma.researchMilestone.findUnique({ where: { id }, select: MILESTONE_SELECT });
    if (!milestone) throw new NotFoundException('Research milestone not found');
    return milestone;
  }

  async findByProject(projectId: string) {
    return this.prisma.researchMilestone.findMany({
      where: { researchProjectId: projectId },
      select: MILESTONE_SELECT,
      orderBy: { milestoneOrder: 'asc' },
    });
  }

  async findMyMilestones(params: { userId: string; page: number; limit: number; status?: string }) {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher) throw new NotFoundException('Researcher profile not found');

    const memberships = await this.prisma.projectMember.findMany({
      where: { researcherId: researcher.id, isActive: true },
      select: { researchProjectId: true },
    });
    const projectIds = memberships.map(m => m.researchProjectId);

    const where: Record<string, unknown> = { researchProjectId: { in: projectIds } };
    if (status) where.status = status as MilestoneStatus;

    const [items, total] = await Promise.all([
      this.prisma.researchMilestone.findMany({ where, select: MILESTONE_SELECT, skip, take: limit, orderBy: { plannedDueDate: 'asc' } }),
      this.prisma.researchMilestone.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOverdue() {
    const items = await this.prisma.researchMilestone.findMany({
      where: {
        plannedDueDate: { lt: new Date() },
        status: { notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED] },
      },
      select: MILESTONE_SELECT,
      orderBy: { plannedDueDate: 'asc' },
    });
    return items;
  }

  async findUpcoming() {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const items = await this.prisma.researchMilestone.findMany({
      where: {
        plannedDueDate: { gte: now, lte: future },
        status: { notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED] },
      },
      select: MILESTONE_SELECT,
      orderBy: { plannedDueDate: 'asc' },
    });
    return items;
  }

  async getSummary() {
    const now = new Date();
    const [total, planned, inProgress, blocked, completed, cancelled, overdue] = await Promise.all([
      this.prisma.researchMilestone.count(),
      this.prisma.researchMilestone.count({ where: { status: MilestoneStatus.PLANNED } }),
      this.prisma.researchMilestone.count({ where: { status: MilestoneStatus.IN_PROGRESS } }),
      this.prisma.researchMilestone.count({ where: { status: MilestoneStatus.BLOCKED } }),
      this.prisma.researchMilestone.count({ where: { status: MilestoneStatus.COMPLETED } }),
      this.prisma.researchMilestone.count({ where: { status: MilestoneStatus.CANCELLED } }),
      this.prisma.researchMilestone.count({
        where: { plannedDueDate: { lt: now }, status: { notIn: [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED] } },
      }),
    ]);

    return { total, planned, inProgress, blocked, completed, cancelled, overdue };
  }

  async getProjectProgress(projectId: string) {
    const now = new Date();
    const [milestones, activities, project] = await Promise.all([
      this.prisma.researchMilestone.findMany({
        where: { researchProjectId: projectId },
        select: { id: true, status: true, progress: true, plannedDueDate: true, actualCompletionDate: true },
      }),
      this.prisma.projectActivity.findMany({
        where: { researchProjectId: projectId },
        select: { id: true, status: true, progress: true, dueDate: true },
      }),
      this.prisma.researchProject.findUnique({
        where: { id: projectId },
        select: { id: true, startDate: true, endDate: true, projectStatus: true },
      }),
    ]);

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
    const overdueMilestones = milestones.filter(m => m.plannedDueDate && m.plannedDueDate < now && !['COMPLETED', 'CANCELLED'].includes(m.status)).length;

    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'COMPLETED').length;

    const overallProgress = totalMilestones > 0
      ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / totalMilestones)
      : 0;

    let scheduleStatus: 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED' = 'ON_TRACK';
    if (project?.projectStatus === 'COMPLETED') {
      scheduleStatus = 'COMPLETED';
    } else if (overdueMilestones > 0) {
      scheduleStatus = 'DELAYED';
    } else if (totalMilestones > 0 && completedMilestones / totalMilestones < 0.5 && project?.endDate) {
      const totalDays = (new Date(project.endDate).getTime() - new Date(project.startDate || now).getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (now.getTime() - new Date(project.startDate || now).getTime()) / (1000 * 60 * 60 * 24);
      if (totalDays > 0 && elapsedDays / totalDays > 0.7) {
        scheduleStatus = 'AT_RISK';
      }
    }

    const daysElapsed = project?.startDate ? Math.floor((now.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysRemaining = project?.endDate ? Math.max(0, Math.floor((new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    return {
      overallProgress,
      totalMilestones,
      completedMilestones,
      overdueMilestones,
      upcomingMilestones: totalMilestones - completedMilestones - overdueMilestones,
      totalActivities,
      completedActivities,
      scheduleStatus,
      daysElapsed,
      daysRemaining,
      startDate: project?.startDate,
      endDate: project?.endDate,
    };
  }

  async create(dto: CreateResearchMilestoneDto, userId: string) {
    const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
    if (!project) throw new NotFoundException('Research project not found');

    if (dto.responsibleMemberId) {
      const member = await this.prisma.projectMember.findUnique({ where: { id: dto.responsibleMemberId } });
      if (!member || member.researchProjectId !== dto.researchProjectId) {
        throw new BadRequestException('Responsible member does not belong to this project');
      }
    }

    if (dto.plannedStartDate && dto.plannedDueDate && new Date(dto.plannedDueDate) < new Date(dto.plannedStartDate)) {
      throw new BadRequestException('Due date cannot be before start date');
    }

    const milestone = await this.prisma.researchMilestone.create({
      data: {
        researchProjectId: dto.researchProjectId,
        title: dto.title,
        description: dto.description,
        milestoneOrder: dto.milestoneOrder || 0,
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : null,
        plannedDueDate: dto.plannedDueDate ? new Date(dto.plannedDueDate) : null,
        responsibleMemberId: dto.responsibleMemberId || null,
        notes: dto.notes,
        createdById: userId,
        status: MilestoneStatus.PLANNED,
      },
      select: MILESTONE_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.CREATE, entityType: 'ResearchMilestone',
      entityId: milestone.id, description: `Created milestone "${dto.title}"`,
      metadata: { researchProjectId: dto.researchProjectId, title: dto.title },
    });

    if (dto.responsibleMemberId) {
      const member = await this.prisma.projectMember.findUnique({ where: { id: dto.responsibleMemberId }, select: { researcherId: true } });
      if (member) {
        const memberUserIds = await this.notificationsService.findUserIdsByResearcherId(member.researcherId);
        await this.notificationsService.createMany(
          memberUserIds.map((notifUserId) => ({
            userId: notifUserId,
            type: NotificationType.ASSIGNMENT,
            title: 'Milestone Assigned',
            message: 'You have been assigned milestone "' + milestone.title + '".',
            entityType: 'ResearchMilestone',
            entityId: milestone.id,
          })),
        );
      }
    }

    return milestone;
  }

  async update(id: string, dto: UpdateResearchMilestoneDto, userId: string) {
    const existing = await this.prisma.researchMilestone.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) throw new NotFoundException('Research milestone not found');

    if (existing.status === MilestoneStatus.COMPLETED || existing.status === MilestoneStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled milestones');
    }

    if (dto.responsibleMemberId) {
      const member = await this.prisma.projectMember.findUnique({ where: { id: dto.responsibleMemberId } });
      if (!member) throw new BadRequestException('Invalid responsible member');
    }

    if (dto.plannedStartDate && dto.plannedDueDate && new Date(dto.plannedDueDate) < new Date(dto.plannedStartDate)) {
      throw new BadRequestException('Due date cannot be before start date');
    }

    const milestone = await this.prisma.researchMilestone.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.milestoneOrder !== undefined && { milestoneOrder: dto.milestoneOrder }),
        ...(dto.plannedStartDate !== undefined && { plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : null }),
        ...(dto.plannedDueDate !== undefined && { plannedDueDate: dto.plannedDueDate ? new Date(dto.plannedDueDate) : null }),
        ...(dto.responsibleMemberId !== undefined && { responsibleMemberId: dto.responsibleMemberId || null }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: MILESTONE_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.UPDATE, entityType: 'ResearchMilestone',
      entityId: id, description: `Updated milestone "${milestone.title}"`,
      metadata: { changedFields: Object.keys(dto).filter(k => dto[k as keyof UpdateResearchMilestoneDto] !== undefined) },
    });

    return milestone;
  }

  async updateStatus(id: string, newStatus: MilestoneStatus, userId: string) {
    const existing = await this.prisma.researchMilestone.findUnique({ where: { id }, select: { id: true, status: true, title: true, researchProjectId: true, responsibleMemberId: true } });
    if (!existing) throw new NotFoundException('Research milestone not found');

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${newStatus}`);
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === MilestoneStatus.COMPLETED) {
      updateData.progress = 100;
      updateData.actualCompletionDate = new Date();
    }

    const milestone = await this.prisma.researchMilestone.update({
      where: { id }, data: updateData, select: MILESTONE_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.STATUS_CHANGE, entityType: 'ResearchMilestone',
      entityId: id, description: `Changed milestone "${existing.title}" status to ${newStatus}`,
      metadata: { previousStatus: existing.status, newStatus },
    });

    const projectMemberUserIds = await this.notificationsService.findProjectMemberUserIds(existing.researchProjectId);
    const statusNotificationMap: Record<string, { type: NotificationType; title: string; message: string }> = {
      COMPLETED: { type: NotificationType.SUCCESS, title: 'Milestone Completed', message: 'Milestone "' + existing.title + '" has been completed.' },
      BLOCKED: { type: NotificationType.WARNING, title: 'Milestone Blocked', message: 'Milestone "' + existing.title + '" is now blocked.' },
      IN_PROGRESS: { type: NotificationType.STATUS_CHANGE, title: 'Milestone In Progress', message: 'Milestone "' + existing.title + '" is now in progress.' },
    };
    const notifConfig = statusNotificationMap[newStatus];
    if (notifConfig) {
      await this.notificationsService.createMany(
        projectMemberUserIds.map((notifUserId) => ({
          userId: notifUserId,
          type: notifConfig.type,
          title: notifConfig.title,
          message: notifConfig.message,
          entityType: 'ResearchMilestone',
          entityId: id,
        })),
      );
    }

    if ((newStatus === MilestoneStatus.BLOCKED || newStatus === MilestoneStatus.COMPLETED) && milestone.responsibleMemberId) {
      const member = await this.prisma.projectMember.findUnique({ where: { id: milestone.responsibleMemberId }, select: { researcherId: true } });
      if (member) {
        const responsibleUserIds = await this.notificationsService.findUserIdsByResearcherId(member.researcherId);
        const alreadyNotified = new Set(projectMemberUserIds);
        const uniqueResponsibleUserIds = responsibleUserIds.filter((uid) => !alreadyNotified.has(uid));
        if (uniqueResponsibleUserIds.length > 0) {
          const respNotif = statusNotificationMap[newStatus];
          await this.notificationsService.createMany(
            uniqueResponsibleUserIds.map((notifUserId) => ({
              userId: notifUserId,
              type: respNotif.type,
              title: respNotif.title,
              message: respNotif.message,
              entityType: 'ResearchMilestone',
              entityId: id,
            })),
          );
        }
      }
    }

    return milestone;
  }

  async updateProgress(id: string, progress: number, userId: string) {
    const existing = await this.prisma.researchMilestone.findUnique({ where: { id }, select: { id: true, status: true, title: true } });
    if (!existing) throw new NotFoundException('Research milestone not found');

    if (existing.status === MilestoneStatus.COMPLETED || existing.status === MilestoneStatus.CANCELLED) {
      throw new BadRequestException('Cannot update progress for completed or cancelled milestones');
    }

    if (existing.status === MilestoneStatus.PLANNED && progress > 0) {
      throw new BadRequestException('Cannot update progress for planned milestones. Start the milestone first.');
    }

    const milestone = await this.prisma.researchMilestone.update({
      where: { id }, data: { progress }, select: MILESTONE_SELECT,
    });

    await this.auditService.log({
      userId, action: AuditAction.PROGRESS_UPDATE, entityType: 'ResearchMilestone',
      entityId: id, description: `Updated milestone "${existing.title}" progress to ${progress}%`,
      metadata: { previousProgress: existing.status, newProgress: progress },
    });

    return milestone;
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.researchMilestone.findUnique({ where: { id }, select: { id: true, title: true, status: true } });
    if (!existing) throw new NotFoundException('Research milestone not found');

    await this.prisma.researchMilestone.delete({ where: { id } });

    await this.auditService.log({
      userId, action: AuditAction.DELETE, entityType: 'ResearchMilestone',
      entityId: id, description: `Deleted milestone "${existing.title}"`,
      metadata: { title: existing.title, status: existing.status },
    });

    return { message: 'Milestone deleted' };
  }
}
