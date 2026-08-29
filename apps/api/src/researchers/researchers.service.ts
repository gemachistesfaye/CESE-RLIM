import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateResearcherDto } from './dto/create-researcher.dto';
import { UpdateResearcherDto } from './dto/update-researcher.dto';
import { AuditAction, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const RESEARCHER_INCLUDE = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ResearcherInclude;

@Injectable()
export class ResearchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    department?: string;
    position?: string;
  }) {
    const { page, limit, search, department, position } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ResearcherWhereInput = {};

    if (search) {
      where.OR = [
        {
          user: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
        { employeeOrStudentId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { academicPosition: { contains: search, mode: 'insensitive' } },
        { researchAreas: { contains: search, mode: 'insensitive' } },
        { expertise: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    if (position) {
      where.academicPosition = { contains: position, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.researcher.findMany({
        where,
        include: RESEARCHER_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.researcher.count({ where }),
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
    const researcher = await this.prisma.researcher.findUnique({
      where: { id },
      include: RESEARCHER_INCLUDE,
    });
    if (!researcher) {
      throw new NotFoundException('Researcher not found');
    }
    return researcher;
  }

  async create(dto: CreateResearcherDto, operatorId: string) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    const existingEmpId = await this.prisma.researcher.findUnique({
      where: { employeeOrStudentId: dto.employeeOrStudentId.trim() },
    });
    if (existingEmpId) {
      throw new ConflictException(
        'A researcher with this employee/student ID already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone?.trim() || null,
          role: 'RESEARCHER',
          passwordHash,
        },
      });

      const researcher = await tx.researcher.create({
        data: {
          userId: user.id,
          employeeOrStudentId: dto.employeeOrStudentId.trim(),
          department: dto.department.trim(),
          academicPosition: dto.academicPosition?.trim() || null,
          researchAreas: dto.researchAreas?.trim() || null,
          expertise: dto.expertise?.trim() || null,
          orcid: dto.orcid?.trim() || null,
          bio: dto.bio?.trim() || null,
        },
        include: RESEARCHER_INCLUDE,
      });

      return researcher;
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.CREATE,
      entityType: 'Researcher',
      entityId: result.id,
      description: `Created researcher ${dto.firstName} ${dto.lastName} (${dto.employeeOrStudentId})`,
    });

    return result;
  }

  async update(id: string, dto: UpdateResearcherDto, operatorId: string) {
    await this.findById(id);

    if (dto.employeeOrStudentId) {
      const existing = await this.prisma.researcher.findFirst({
        where: {
          employeeOrStudentId: dto.employeeOrStudentId.trim(),
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          'A researcher with this employee/student ID already exists',
        );
      }
    }

    const data: Prisma.ResearcherUpdateInput = {};
    if (dto.employeeOrStudentId !== undefined)
      data.employeeOrStudentId = dto.employeeOrStudentId.trim();
    if (dto.department !== undefined) data.department = dto.department.trim();
    if (dto.academicPosition !== undefined)
      data.academicPosition = dto.academicPosition?.trim() || null;
    if (dto.researchAreas !== undefined)
      data.researchAreas = dto.researchAreas?.trim() || null;
    if (dto.expertise !== undefined)
      data.expertise = dto.expertise?.trim() || null;
    if (dto.orcid !== undefined) data.orcid = dto.orcid?.trim() || null;
    if (dto.bio !== undefined) data.bio = dto.bio?.trim() || null;

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const researcher = await this.prisma.researcher.update({
      where: { id },
      data,
      include: RESEARCHER_INCLUDE,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'Researcher',
      entityId: id,
      description: `Updated researcher profile for ${researcher.user.firstName} ${researcher.user.lastName}`,
      metadata: { fields: Object.keys(data) },
    });

    return researcher;
  }

  async findByUserId(userId: string) {
    const researcher = await this.prisma.researcher.findUnique({
      where: { userId },
      include: RESEARCHER_INCLUDE,
    });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found for this user');
    }
    return researcher;
  }

  async updateMe(userId: string, dto: UpdateResearcherDto) {
    const researcher = await this.findByUserId(userId);

    if (dto.employeeOrStudentId) {
      const existing = await this.prisma.researcher.findFirst({
        where: {
          employeeOrStudentId: dto.employeeOrStudentId.trim(),
          id: { not: researcher.id },
        },
      });
      if (existing) {
        throw new ConflictException(
          'A researcher with this employee/student ID already exists',
        );
      }
    }

    const data: Prisma.ResearcherUpdateInput = {};
    if (dto.employeeOrStudentId !== undefined)
      data.employeeOrStudentId = dto.employeeOrStudentId.trim();
    if (dto.department !== undefined) data.department = dto.department.trim();
    if (dto.academicPosition !== undefined)
      data.academicPosition = dto.academicPosition?.trim() || null;
    if (dto.researchAreas !== undefined)
      data.researchAreas = dto.researchAreas?.trim() || null;
    if (dto.expertise !== undefined)
      data.expertise = dto.expertise?.trim() || null;
    if (dto.orcid !== undefined) data.orcid = dto.orcid?.trim() || null;
    if (dto.bio !== undefined) data.bio = dto.bio?.trim() || null;

    if (Object.keys(data).length === 0) {
      return this.findById(researcher.id);
    }

    return this.prisma.researcher.update({
      where: { id: researcher.id },
      data,
      include: RESEARCHER_INCLUDE,
    });
  }
}
