import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProjectActivityDto } from './dto/create-project-activity.dto';
import { UpdateProjectActivityDto } from './dto/update-project-activity.dto';
import { UpdateProjectActivityStatusDto } from './dto/update-project-activity-status.dto';
import { UpdateProjectActivityProgressDto } from './dto/update-project-activity-progress.dto';
import {
  AuditAction,
  ActivityStatus,
  RequestPriority,
  Prisma,
  UserRole,
} from '@prisma/client';

const PROJECT_ACTIVITY_SELECT = {
  id: true,
  researchProjectId: true,
  assignedMemberId: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  startDate: true,
  dueDate: true,
  completedAt: true,
  progress: true,
  notes: true,
  createdById: true,
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
  assignedMember: {
    select: {
      id: true,
      role: true,
      isActive: true,
      researcher: {
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
} satisfies Prisma.ProjectActivitySelect;

const VALID_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  [ActivityStatus.TODO]: [ActivityStatus.IN_PROGRESS, ActivityStatus.CANCELLED],
  [ActivityStatus.IN_PROGRESS]: [
    ActivityStatus.BLOCKED,
    ActivityStatus.COMPLETED,
    ActivityStatus.TODO,
    ActivityStatus.CANCELLED,
  ],
  [ActivityStatus.BLOCKED]: [ActivityStatus.IN_PROGRESS, ActivityStatus.CANCELLED],
  [ActivityStatus.COMPLETED]: [ActivityStatus.IN_PROGRESS],
  [ActivityStatus.CANCELLED]: [],
};

@Injectable()
export class ProjectActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    priority?: string;
    researchProjectId?: string;
    assignedMemberId?: string;
    overdue?: string;
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
      priority,
      researchProjectId,
      assignedMemberId,
      overdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userRole,
      userId,
    } = params;

    const where: Prisma.ProjectActivityWhereInput = {};

    if (userRole === UserRole.RESEARCHER && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (researcher) {
        const memberships = await this.prisma.projectMember.findMany({
          where: { researcherId: researcher.id, isActive: true },
          select: { id: true },
        });
        const memberIds = memberships.map((m) => m.id);
        where.OR = [
          { createdById: userId },
          { assignedMemberId: { in: memberIds } },
          { researchProjectId: { in: (await this.prisma.projectMember.findMany({
            where: { researcherId: researcher.id },
            select: { researchProjectId: true },
          })).map(m => m.researchProjectId) } },
        ];
      }
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { researchProject: { title: { contains: search, mode: 'insensitive' as const } } },
          { researchProject: { projectCode: { contains: search, mode: 'insensitive' as const } } },
          {
            assignedMember: {
              researcher: {
                user: {
                  firstName: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
          },
          {
            assignedMember: {
              researcher: {
                user: {
                  lastName: { contains: search, mode: 'insensitive' as const },
                },
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
      where.status = status as ActivityStatus;
    }

    if (priority) {
      where.priority = priority as RequestPriority;
    }

    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    if (assignedMemberId) {
      where.assignedMemberId = assignedMemberId;
    }

    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED] };
    }

    const [items, total] = await Promise.all([
      this.prisma.projectActivity.findMany({
        where,
        select: PROJECT_ACTIVITY_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectActivity.count({ where }),
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
    const activity = await this.prisma.projectActivity.findUnique({
      where: { id },
      select: PROJECT_ACTIVITY_SELECT,
    });

    if (!activity) {
      throw new NotFoundException('Project activity not found');
    }

    return activity;
  }

  async getSummary(researchProjectId?: string) {
    const where: Prisma.ProjectActivityWhereInput = {};
    if (researchProjectId) {
      where.researchProjectId = researchProjectId;
    }

    const now = new Date();

    const [
      total,
      todo,
      inProgress,
      blocked,
      completed,
      cancelled,
      overdue,
      highPriority,
      urgentPriority,
    ] = await Promise.all([
      this.prisma.projectActivity.count({ where }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.TODO } }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.IN_PROGRESS } }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.BLOCKED } }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.COMPLETED } }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.CANCELLED } }),
      this.prisma.projectActivity.count({
        where: {
          ...where,
          dueDate: { lt: now },
          status: { notIn: [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED] },
        },
      }),
      this.prisma.projectActivity.count({ where: { ...where, priority: RequestPriority.HIGH } }),
      this.prisma.projectActivity.count({ where: { ...where, priority: RequestPriority.URGENT } }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      blocked,
      completed,
      cancelled,
      overdue,
      completionRate,
      highPriority,
      urgentPriority,
    };
  }

  async getMyActivities(userId: string, params: {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    overdue?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, status, priority, overdue, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const researcher = await this.prisma.researcher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { researcherId: researcher.id, isActive: true },
      select: { id: true },
    });
    const memberIds = memberships.map((m) => m.id);

    const where: Prisma.ProjectActivityWhereInput = {
      OR: [
        { createdById: userId },
        { assignedMemberId: { in: memberIds } },
      ],
    };

    if (status) {
      where.status = status as ActivityStatus;
    }

    if (priority) {
      where.priority = priority as RequestPriority;
    }

    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED] };
    }

    const [items, total] = await Promise.all([
      this.prisma.projectActivity.findMany({
        where,
        select: PROJECT_ACTIVITY_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectActivity.count({ where }),
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

  async getOverdueActivities(userRole: UserRole, userId: string) {
    const where: Prisma.ProjectActivityWhereInput = {
      dueDate: { lt: new Date() },
      status: { notIn: [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED] },
    };

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (researcher) {
        const memberships = await this.prisma.projectMember.findMany({
          where: { researcherId: researcher.id, isActive: true },
          select: { id: true },
        });
        const memberIds = memberships.map((m) => m.id);
        where.OR = [
          { createdById: userId },
          { assignedMemberId: { in: memberIds } },
        ];
      }
    }

    const items = await this.prisma.projectActivity.findMany({
      where,
      select: PROJECT_ACTIVITY_SELECT,
      orderBy: { dueDate: 'asc' },
    });

    return items;
  }

  async create(dto: CreateProjectActivityDto, userId: string, userRole: UserRole) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: dto.researchProjectId },
    });

    if (!project) {
      throw new NotFoundException('Research project not found');
    }

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher) {
        throw new ForbiddenException('Researcher profile not found');
      }
      const membership = await this.prisma.projectMember.findUnique({
        where: {
          researchProjectId_researcherId: {
            researchProjectId: dto.researchProjectId,
            researcherId: researcher.id,
          },
        },
      });
      if (!membership || !membership.isActive) {
        throw new ForbiddenException('You are not an active member of this project');
      }
    }

    if (dto.assignedMemberId) {
      const member = await this.prisma.projectMember.findUnique({
        where: { id: dto.assignedMemberId },
      });
      if (!member) {
        throw new NotFoundException('Project member not found');
      }
      if (member.researchProjectId !== dto.researchProjectId) {
        throw new BadRequestException('Assigned member does not belong to this project');
      }
      if (!member.isActive) {
        throw new BadRequestException('Cannot assign activities to inactive members');
      }
    }

    if (dto.startDate && dto.dueDate && new Date(dto.dueDate) < new Date(dto.startDate)) {
      throw new BadRequestException('Due date cannot be before start date');
    }

    const progress = dto.progress ?? 0;
    const status = dto.status || ActivityStatus.TODO;

    if (status === ActivityStatus.TODO && progress !== 0) {
      throw new BadRequestException('TODO activities must have 0% progress');
    }
    if (status === ActivityStatus.IN_PROGRESS && (progress < 1 || progress > 99)) {
      throw new BadRequestException('IN_PROGRESS activities must have 1-99% progress');
    }
    if (status === ActivityStatus.COMPLETED && progress !== 100) {
      throw new BadRequestException('COMPLETED activities must have 100% progress');
    }

    const activity = await this.prisma.projectActivity.create({
      data: {
        researchProjectId: dto.researchProjectId,
        assignedMemberId: dto.assignedMemberId || null,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        priority: dto.priority || RequestPriority.MEDIUM,
        status,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        completedAt: status === ActivityStatus.COMPLETED ? new Date() : null,
        progress,
        notes: dto.notes?.trim(),
        createdById: userId,
      },
      select: PROJECT_ACTIVITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ProjectActivity',
      entityId: activity.id,
      description: `Created activity "${activity.title}" in project ${activity.researchProject.projectCode}`,
      metadata: {
        researchProjectId: dto.researchProjectId,
        assignedMemberId: dto.assignedMemberId,
        priority: activity.priority,
        status: activity.status,
      },
    });

    return activity;
  }

  async update(id: string, dto: UpdateProjectActivityDto, userId: string, userRole: UserRole) {
    const existing = await this.findById(id);

    if (userRole === UserRole.RESEARCHER) {
      if (existing.createdById !== userId) {
        if (!existing.assignedMember) {
          throw new ForbiddenException('You can only update activities assigned to you');
        }
        const researcher = await this.prisma.researcher.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!researcher || existing.assignedMember.researcher.id !== researcher.id) {
          throw new ForbiddenException('You can only update activities assigned to you');
        }
      }
    }

    if (dto.assignedMemberId) {
      const member = await this.prisma.projectMember.findUnique({
        where: { id: dto.assignedMemberId },
      });
      if (!member) {
        throw new NotFoundException('Project member not found');
      }
      if (member.researchProjectId !== existing.researchProjectId) {
        throw new BadRequestException('Assigned member does not belong to this project');
      }
      if (!member.isActive) {
        throw new BadRequestException('Cannot assign activities to inactive members');
      }
    }

    if (dto.startDate && dto.dueDate && new Date(dto.dueDate) < new Date(dto.startDate)) {
      throw new BadRequestException('Due date cannot be before start date');
    }

    const activity = await this.prisma.projectActivity.update({
      where: { id },
      data: {
        assignedMemberId: dto.assignedMemberId !== undefined ? dto.assignedMemberId : undefined,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes?.trim(),
      },
      select: PROJECT_ACTIVITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ProjectActivity',
      entityId: id,
      description: `Updated activity "${activity.title}" in project ${activity.researchProject.projectCode}`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        changes: dto,
      },
    });

    return activity;
  }

  async updateStatus(id: string, dto: UpdateProjectActivityStatusDto, userId: string) {
    const existing = await this.findById(id);

    const allowedTransitions = VALID_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${dto.status}`,
      );
    }

    const updateData: Prisma.ProjectActivityUpdateInput = {
      status: dto.status,
    };

    if (dto.status === ActivityStatus.COMPLETED) {
      updateData.progress = 100;
      updateData.completedAt = new Date();
    } else if (dto.status === ActivityStatus.IN_PROGRESS && existing.status === ActivityStatus.COMPLETED) {
      updateData.completedAt = null;
      if (existing.progress === 100) {
        updateData.progress = 50;
      }
    }

    const activity = await this.prisma.projectActivity.update({
      where: { id },
      data: updateData,
      select: PROJECT_ACTIVITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'ProjectActivity',
      entityId: id,
      description: `Changed activity "${activity.title}" status from ${existing.status} to ${dto.status}`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        previousStatus: existing.status,
        newStatus: dto.status,
      },
    });

    return activity;
  }

  async updateProgress(id: string, dto: UpdateProjectActivityProgressDto, userId: string) {
    const existing = await this.findById(id);

    if (existing.status === ActivityStatus.TODO && dto.progress !== 0) {
      throw new BadRequestException('TODO activities must have 0% progress');
    }
    if (existing.status === ActivityStatus.IN_PROGRESS && (dto.progress < 1 || dto.progress > 99)) {
      throw new BadRequestException('IN_PROGRESS activities must have 1-99% progress');
    }
    if (existing.status === ActivityStatus.COMPLETED && dto.progress !== 100) {
      throw new BadRequestException('COMPLETED activities must have 100% progress');
    }
    if (existing.status === ActivityStatus.CANCELLED) {
      throw new BadRequestException('Cannot update progress of cancelled activities');
    }

    const updateData: Prisma.ProjectActivityUpdateInput = {
      progress: dto.progress,
    };

    if (dto.progress === 100 && existing.status !== ActivityStatus.COMPLETED) {
      updateData.status = ActivityStatus.COMPLETED;
      updateData.completedAt = new Date();
    }

    const activity = await this.prisma.projectActivity.update({
      where: { id },
      data: updateData,
      select: PROJECT_ACTIVITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.PROGRESS_UPDATE,
      entityType: 'ProjectActivity',
      entityId: id,
      description: `Updated activity "${activity.title}" progress from ${existing.progress}% to ${dto.progress}%`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        previousProgress: existing.progress,
        newProgress: dto.progress,
      },
    });

    return activity;
  }

  async cancel(id: string, userId: string) {
    const existing = await this.findById(id);

    if (existing.status === ActivityStatus.CANCELLED) {
      throw new BadRequestException('Activity is already cancelled');
    }

    const activity = await this.prisma.projectActivity.update({
      where: { id },
      data: { status: ActivityStatus.CANCELLED },
      select: PROJECT_ACTIVITY_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'ProjectActivity',
      entityId: id,
      description: `Cancelled activity "${activity.title}" in project ${activity.researchProject.projectCode}`,
      metadata: {
        researchProjectId: existing.researchProjectId,
        previousStatus: existing.status,
      },
    });

    return activity;
  }

  async getProjectActivityStats(projectId: string) {
    const where: Prisma.ProjectActivityWhereInput = {
      researchProjectId: projectId,
    };

    const now = new Date();

    const [total, completed, inProgress, blocked, overdue] = await Promise.all([
      this.prisma.projectActivity.count({ where }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.COMPLETED } }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.IN_PROGRESS } }),
      this.prisma.projectActivity.count({ where: { ...where, status: ActivityStatus.BLOCKED } }),
      this.prisma.projectActivity.count({
        where: {
          ...where,
          dueDate: { lt: now },
          status: { notIn: [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED] },
        },
      }),
    ]);

    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      blocked,
      overdue,
      completionPercentage,
    };
  }
}
