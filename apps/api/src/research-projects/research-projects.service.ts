import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateResearchProjectDto } from './dto/create-research-project.dto';
import { UpdateResearchProjectDto } from './dto/update-research-project.dto';
import { UpdateResearchProjectStatusDto } from './dto/update-research-project-status.dto';
import { AuditAction, ProjectStatus, Prisma } from '@prisma/client';

const PROJECT_SELECT = {
  id: true,
  projectCode: true,
  title: true,
  description: true,
  projectStatus: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  equipmentRequests: {
    select: {
      id: true,
      purpose: true,
      startDate: true,
      expectedReturnDate: true,
      priority: true,
      status: true,
      requester: {
        select: {
          id: true,
          userId: true,
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
      equipment: {
        select: {
          id: true,
          name: true,
          assetId: true,
          category: true,
          status: true,
        },
      },
    },
  },
  equipmentAssignments: {
    select: {
      id: true,
      issuedAt: true,
      expectedReturnAt: true,
      returnedAt: true,
      conditionAtIssue: true,
      conditionAtReturn: true,
      notes: true,
      researcher: {
        select: {
          id: true,
          userId: true,
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
      equipment: {
        select: {
          id: true,
          name: true,
          assetId: true,
          category: true,
          status: true,
        },
      },
    },
  },
  innovations: {
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      developmentStage: true,
      status: true,
      submittedBy: {
        select: {
          id: true,
          userId: true,
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
} satisfies Prisma.ResearchProjectSelect;

@Injectable()
export class ResearchProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, status, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const where: Prisma.ResearchProjectWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { projectCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.projectStatus = status as ProjectStatus;
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    const [items, total] = await Promise.all([
      this.prisma.researchProject.findMany({
        where,
        select: {
          id: true,
          projectCode: true,
          title: true,
          description: true,
          projectStatus: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              equipmentRequests: true,
              equipmentAssignments: true,
              innovations: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.researchProject.count({ where }),
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
    const project = await this.prisma.researchProject.findUnique({
      where: { id },
      select: PROJECT_SELECT,
    });

    if (!project) {
      throw new NotFoundException('Research project not found');
    }

    return project;
  }

  async create(dto: CreateResearchProjectDto, userId: string) {
    const existing = await this.prisma.researchProject.findUnique({
      where: { projectCode: dto.projectCode },
    });

    if (existing) {
      throw new ConflictException('Project code already exists');
    }

    if (dto.startDate && dto.endDate && new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const project = await this.prisma.researchProject.create({
      data: {
        projectCode: dto.projectCode,
        title: dto.title,
        description: dto.description,
        projectStatus: dto.projectStatus || ProjectStatus.ACTIVE,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      select: PROJECT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchProject',
      entityId: project.id,
      description: `Created research project "${project.title}"`,
    });

    return project;
  }

  async update(id: string, dto: UpdateResearchProjectDto, userId: string) {
    const existing = await this.findById(id);

    if (dto.startDate && dto.endDate && new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const data: Prisma.ResearchProjectUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const project = await this.prisma.researchProject.update({
      where: { id },
      data,
      select: PROJECT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchProject',
      entityId: id,
      description: `Updated research project "${project.title}"`,
      metadata: { fields: Object.keys(data) },
    });

    return project;
  }

  async updateStatus(id: string, dto: UpdateResearchProjectStatusDto, userId: string) {
    const existing = await this.findById(id);

    const validTransitions: Record<string, ProjectStatus[]> = {
      [ProjectStatus.ACTIVE]: [ProjectStatus.COMPLETED, ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED],
      [ProjectStatus.ON_HOLD]: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
    };

    const allowed = validTransitions[existing.projectStatus];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.projectStatus} to ${dto.status}`,
      );
    }

    const project = await this.prisma.researchProject.update({
      where: { id },
      data: { projectStatus: dto.status },
      select: PROJECT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchProject',
      entityId: id,
      description: `Changed project status from ${existing.projectStatus} to ${dto.status}`,
      metadata: { from: existing.projectStatus, to: dto.status },
    });

    return project;
  }

  async getProjectMembers(id: string) {
    await this.findById(id);

    const [requesters, assignees, innovators] = await Promise.all([
      this.prisma.equipmentRequest.findMany({
        where: { researchProjectId: id },
        select: {
          requester: {
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
        },
        distinct: ['requesterId'],
      }),
      this.prisma.equipmentAssignment.findMany({
        where: { researchProjectId: id },
        select: {
          researcher: {
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
        },
        distinct: ['researcherId'],
      }),
      this.prisma.innovation.findMany({
        where: { researchProjectId: id },
        select: {
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
        },
        distinct: ['submittedById'],
      }),
    ]);

    const memberMap = new Map<string, any>();

    for (const r of requesters) {
      if (!memberMap.has(r.requester.id)) {
        memberMap.set(r.requester.id, {
          ...r.requester,
          roles: ['Equipment Requester'],
        });
      } else {
        const existing = memberMap.get(r.requester.id);
        if (!existing.roles.includes('Equipment Requester')) {
          existing.roles.push('Equipment Requester');
        }
      }
    }

    for (const a of assignees) {
      if (!memberMap.has(a.researcher.id)) {
        memberMap.set(a.researcher.id, {
          ...a.researcher,
          roles: ['Equipment User'],
        });
      } else {
        const existing = memberMap.get(a.researcher.id);
        if (!existing.roles.includes('Equipment User')) {
          existing.roles.push('Equipment User');
        }
      }
    }

    for (const i of innovators) {
      if (!memberMap.has(i.submittedBy.id)) {
        memberMap.set(i.submittedBy.id, {
          ...i.submittedBy,
          roles: ['Innovation Submitter'],
        });
      } else {
        const existing = memberMap.get(i.submittedBy.id);
        if (!existing.roles.includes('Innovation Submitter')) {
          existing.roles.push('Innovation Submitter');
        }
      }
    }

    return Array.from(memberMap.values());
  }

  async getSummary() {
    const [
      total,
      active,
      completed,
      onHold,
      cancelled,
    ] = await Promise.all([
      this.prisma.researchProject.count(),
      this.prisma.researchProject.count({ where: { projectStatus: ProjectStatus.ACTIVE } }),
      this.prisma.researchProject.count({ where: { projectStatus: ProjectStatus.COMPLETED } }),
      this.prisma.researchProject.count({ where: { projectStatus: ProjectStatus.ON_HOLD } }),
      this.prisma.researchProject.count({ where: { projectStatus: ProjectStatus.CANCELLED } }),
    ]);

    return { total, active, completed, onHold, cancelled };
  }
}
