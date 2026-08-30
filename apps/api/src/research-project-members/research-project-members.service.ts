import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { AuditAction, ProjectMemberRole, ProjectStatus, Prisma } from '@prisma/client';

const PROJECT_MEMBER_SELECT = {
  id: true,
  researchProjectId: true,
  researcherId: true,
  role: true,
  isActive: true,
  joinedAt: true,
  leftAt: true,
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
  researcher: {
    select: {
      id: true,
      userId: true,
      employeeOrStudentId: true,
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
} satisfies Prisma.ProjectMemberSelect;

@Injectable()
export class ResearchProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findByProject(projectId: string, params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    await this.validateProjectExists(projectId);

    const { page, limit, search, role, sortBy = 'joinedAt', sortOrder = 'desc' } = params;

    const where: Prisma.ProjectMemberWhereInput = {
      researchProjectId: projectId,
    };

    if (search) {
      where.OR = [
        {
          researcher: {
            user: {
              firstName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          researcher: {
            user: {
              lastName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          researcher: {
            user: {
              email: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          researcher: {
            employeeOrStudentId: { contains: search, mode: 'insensitive' },
          },
        },
        {
          researcher: {
            department: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (role) {
      where.role = role as ProjectMemberRole;
    }

    const [items, total] = await Promise.all([
      this.prisma.projectMember.findMany({
        where,
        select: PROJECT_MEMBER_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectMember.count({ where }),
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

  async findByResearcher(researcherId: string, params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    await this.validateResearcherExists(researcherId);

    const { page, limit, search, status, sortBy = 'joinedAt', sortOrder = 'desc' } = params;

    const where: Prisma.ProjectMemberWhereInput = {
      researcherId,
    };

    if (search) {
      where.OR = [
        {
          researchProject: {
            title: { contains: search, mode: 'insensitive' },
          },
        },
        {
          researchProject: {
            projectCode: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [items, total] = await Promise.all([
      this.prisma.projectMember.findMany({
        where,
        select: PROJECT_MEMBER_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectMember.count({ where }),
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
    const member = await this.prisma.projectMember.findUnique({
      where: { id },
      select: PROJECT_MEMBER_SELECT,
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    return member;
  }

  async getProjectTeamSummary(projectId: string) {
    await this.validateProjectExists(projectId);

    const [totalMembers, activeMembers, inactiveMembers, ...roleCounts] = await Promise.all([
      this.prisma.projectMember.count({
        where: { researchProjectId: projectId },
      }),
      this.prisma.projectMember.count({
        where: { researchProjectId: projectId, isActive: true },
      }),
      this.prisma.projectMember.count({
        where: { researchProjectId: projectId, isActive: false },
      }),
      ...Object.values(ProjectMemberRole).map((role) =>
        this.prisma.projectMember.count({
          where: { researchProjectId: projectId, role, isActive: true },
        })
      ),
    ]);

    const byRole = Object.values(ProjectMemberRole).reduce(
      (acc, role, index) => ({
        ...acc,
        [role]: roleCounts[index],
      }),
      {} as Record<ProjectMemberRole, number>
    );

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      byRole,
    };
  }

  async create(dto: CreateProjectMemberDto, userId: string) {
    await this.validateProjectExists(dto.researchProjectId);
    await this.validateResearcherExists(dto.researcherId);

    const project = await this.prisma.researchProject.findUnique({
      where: { id: dto.researchProjectId },
    });

    if (project?.projectStatus === ProjectStatus.CANCELLED) {
      throw new BadRequestException('Cannot add members to a cancelled project');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        researchProjectId_researcherId: {
          researchProjectId: dto.researchProjectId,
          researcherId: dto.researcherId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.isActive) {
        throw new ConflictException('Researcher is already an active member of this project');
      } else {
        return this.reactivateMember(existingMember.id, dto.role || existingMember.role, userId);
      }
    }

    const member = await this.prisma.projectMember.create({
      data: {
        researchProjectId: dto.researchProjectId,
        researcherId: dto.researcherId,
        role: dto.role || ProjectMemberRole.RESEARCHER,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      select: PROJECT_MEMBER_SELECT,
    });

    const researcher = await this.prisma.researcher.findUnique({
      where: { id: dto.researcherId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const projectData = await this.prisma.researchProject.findUnique({
      where: { id: dto.researchProjectId },
      select: { projectCode: true, title: true },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchProjectMember',
      entityId: member.id,
      description: `Added researcher ${researcher?.user.firstName} ${researcher?.user.lastName} to project ${projectData?.projectCode} (${projectData?.title}) as ${member.role}`,
      metadata: {
        researchProjectId: dto.researchProjectId,
        researcherId: dto.researcherId,
        role: member.role,
      },
    });

    return member;
  }

  async update(id: string, dto: UpdateProjectMemberDto, userId: string) {
    const existingMember = await this.findById(id);

    if (dto.role !== undefined && dto.role !== existingMember.role) {
      const previousRole = existingMember.role;

      const member = await this.prisma.projectMember.update({
        where: { id },
        data: { role: dto.role },
        select: PROJECT_MEMBER_SELECT,
      });

      const researcher = await this.prisma.researcher.findUnique({
        where: { id: existingMember.researcherId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });

      await this.auditService.log({
        userId,
        action: AuditAction.UPDATE,
        entityType: 'ResearchProjectMember',
        entityId: id,
        description: `Changed ${researcher?.user.firstName} ${researcher?.user.lastName}'s role from ${previousRole} to ${dto.role} in project ${existingMember.researchProject.projectCode}`,
        metadata: {
          researchProjectId: existingMember.researchProjectId,
          researcherId: existingMember.researcherId,
          previousRole,
          newRole: dto.role,
        },
      });

      return member;
    }

    if (dto.isActive !== undefined && dto.isActive !== existingMember.isActive) {
      const member = await this.prisma.projectMember.update({
        where: { id },
        data: {
          isActive: dto.isActive,
          leftAt: dto.isActive ? null : new Date(),
        },
        select: PROJECT_MEMBER_SELECT,
      });

      const researcher = await this.prisma.researcher.findUnique({
        where: { id: existingMember.researcherId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });

      await this.auditService.log({
        userId,
        action: AuditAction.UPDATE,
        entityType: 'ResearchProjectMember',
        entityId: id,
        description: `${dto.isActive ? 'Reactivated' : 'Deactivated'} ${researcher?.user.firstName} ${researcher?.user.lastName} in project ${existingMember.researchProject.projectCode}`,
        metadata: {
          researchProjectId: existingMember.researchProjectId,
          researcherId: existingMember.researcherId,
          isActive: dto.isActive,
        },
      });

      return member;
    }

    return existingMember;
  }

  async remove(id: string, userId: string) {
    const member = await this.findById(id);

    if (!member.isActive) {
      throw new BadRequestException('Member is already inactive');
    }

    const updatedMember = await this.prisma.projectMember.update({
      where: { id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
      select: PROJECT_MEMBER_SELECT,
    });

    const researcher = await this.prisma.researcher.findUnique({
      where: { id: member.researcherId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'ResearchProjectMember',
      entityId: id,
      description: `Removed ${researcher?.user.firstName} ${researcher?.user.lastName} from project ${member.researchProject.projectCode} (role was ${member.role})`,
      metadata: {
        researchProjectId: member.researchProjectId,
        researcherId: member.researcherId,
        previousRole: member.role,
      },
    });

    return updatedMember;
  }

  private async validateProjectExists(projectId: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Research project not found');
    }
    return project;
  }

  private async validateResearcherExists(researcherId: string) {
    const researcher = await this.prisma.researcher.findUnique({
      where: { id: researcherId },
    });
    if (!researcher) {
      throw new NotFoundException('Researcher not found');
    }
    return researcher;
  }

  private async reactivateMember(memberId: string, role: ProjectMemberRole, userId: string) {
    const member = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: {
        isActive: true,
        leftAt: null,
        role,
      },
      select: PROJECT_MEMBER_SELECT,
    });

    const researcher = await this.prisma.researcher.findUnique({
      where: { id: member.researcherId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchProjectMember',
      entityId: memberId,
      description: `Reactivated ${researcher?.user.firstName} ${researcher?.user.lastName} in project ${member.researchProject.projectCode} as ${role}`,
      metadata: {
        researchProjectId: member.researchProjectId,
        researcherId: member.researcherId,
        role,
      },
    });

    return member;
  }
}
