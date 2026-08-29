import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLaboratoryDto } from './dto/create-laboratory.dto';
import { UpdateLaboratoryDto } from './dto/update-laboratory.dto';
import { UpdateLaboratoryStatusDto } from './dto/update-laboratory-status.dto';
import { AuditAction, LabStatus, Prisma } from '@prisma/client';

const LABORATORY_SELECT = {
  id: true,
  name: true,
  code: true,
  location: true,
  description: true,
  capacity: true,
  responsiblePersonId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { equipment: true } },
} satisfies Prisma.LaboratorySelect;

@Injectable()
export class LaboratoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    location?: string;
  }) {
    const { page, limit, search, status, location } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LaboratoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as LabStatus;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.laboratory.findMany({
        where,
        select: LABORATORY_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.laboratory.count({ where }),
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
    const lab = await this.prisma.laboratory.findUnique({
      where: { id },
      select: {
        ...LABORATORY_SELECT,
        equipment: {
          select: {
            id: true,
            name: true,
            assetId: true,
            category: true,
            condition: true,
            status: true,
          },
        },
      },
    });
    if (!lab) {
      throw new NotFoundException('Laboratory not found');
    }
    return lab;
  }

  async create(dto: CreateLaboratoryDto, operatorId: string) {
    const existingCode = await this.prisma.laboratory.findUnique({
      where: { code: dto.code.trim() },
    });
    if (existingCode) {
      throw new ConflictException('A laboratory with this code already exists');
    }

    if (dto.responsiblePersonId) {
      const person = await this.prisma.user.findUnique({
        where: { id: dto.responsiblePersonId },
      });
      if (!person) {
        throw new NotFoundException('Responsible person not found');
      }
    }

    const lab = await this.prisma.laboratory.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        location: dto.location.trim(),
        description: dto.description?.trim() || null,
        capacity: dto.capacity ?? null,
        responsiblePersonId: dto.responsiblePersonId || null,
      },
      select: LABORATORY_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.CREATE,
      entityType: 'Laboratory',
      entityId: lab.id,
      description: `Created laboratory ${lab.name} (${lab.code})`,
      metadata: { name: lab.name, code: lab.code, location: lab.location },
    });

    return lab;
  }

  async update(id: string, dto: UpdateLaboratoryDto, operatorId: string) {
    await this.findById(id);

    if (dto.name !== undefined) {
      const existing = await this.prisma.laboratory.findFirst({
        where: { name: dto.name.trim(), id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('A laboratory with this name already exists');
      }
    }

    if (dto.responsiblePersonId) {
      const person = await this.prisma.user.findUnique({
        where: { id: dto.responsiblePersonId },
      });
      if (!person) {
        throw new NotFoundException('Responsible person not found');
      }
    }

    const data: Prisma.LaboratoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.location !== undefined) data.location = dto.location.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.capacity !== undefined) data.capacity = dto.capacity ?? null;
    if (dto.responsiblePersonId !== undefined)
      data.responsiblePersonId = dto.responsiblePersonId || null;

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const lab = await this.prisma.laboratory.update({
      where: { id },
      data,
      select: LABORATORY_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'Laboratory',
      entityId: id,
      description: `Updated laboratory ${lab.name} (${lab.code})`,
      metadata: { fields: Object.keys(data) },
    });

    return lab;
  }

  async updateStatus(
    id: string,
    dto: UpdateLaboratoryStatusDto,
    operatorId: string,
  ) {
    const lab = await this.findById(id);

    if (lab.status === dto.status) {
      return lab;
    }

    const updated = await this.prisma.laboratory.update({
      where: { id },
      data: { status: dto.status },
      select: LABORATORY_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'Laboratory',
      entityId: id,
      description: `Changed status of laboratory ${lab.name} from ${lab.status} to ${dto.status}`,
      metadata: { previousStatus: lab.status, newStatus: dto.status },
    });

    return updated;
  }
}
