import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { AuditAction, EquipmentCondition, EquipmentStatus, Prisma } from '@prisma/client';

const EQUIPMENT_SELECT = {
  id: true,
  name: true,
  assetId: true,
  serialNumber: true,
  category: true,
  manufacturer: true,
  model: true,
  description: true,
  purchaseDate: true,
  purchasePrice: true,
  laboratoryId: true,
  condition: true,
  status: true,
  warrantyExpiry: true,
  createdAt: true,
  updatedAt: true,
  laboratory: {
    select: {
      id: true,
      name: true,
      code: true,
      location: true,
    },
  },
} satisfies Prisma.EquipmentSelect;

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    condition?: string;
    category?: string;
    laboratoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, status, condition, category, laboratoryId, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipmentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetId: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { laboratory: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status as EquipmentStatus;
    }

    if (condition) {
      where.condition = condition as EquipmentCondition;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (laboratoryId) {
      where.laboratoryId = laboratoryId;
    }

    const validSortFields = ['createdAt', 'name', 'assetId', 'status', 'condition', 'category'];
    const sortField = validSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        select: EQUIPMENT_SELECT,
        skip,
        take: limit,
        orderBy: { [sortField!]: order },
      }),
      this.prisma.equipment.count({ where }),
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
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      select: EQUIPMENT_SELECT,
    });
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }
    return equipment;
  }

  async create(dto: CreateEquipmentDto, operatorId: string) {
    const existingAssetId = await this.prisma.equipment.findUnique({
      where: { assetId: dto.assetId.trim() },
    });
    if (existingAssetId) {
      throw new ConflictException('An equipment with this asset ID already exists');
    }

    if (dto.serialNumber) {
      const existingSerial = await this.prisma.equipment.findFirst({
        where: { serialNumber: dto.serialNumber.trim() },
      });
      if (existingSerial) {
        throw new ConflictException('An equipment with this serial number already exists');
      }
    }

    const laboratory = await this.prisma.laboratory.findUnique({
      where: { id: dto.laboratoryId },
    });
    if (!laboratory) {
      throw new NotFoundException('Laboratory not found');
    }

    const equipment = await this.prisma.equipment.create({
      data: {
        name: dto.name.trim(),
        assetId: dto.assetId.trim(),
        serialNumber: dto.serialNumber?.trim() || null,
        category: dto.category.trim(),
        manufacturer: dto.manufacturer?.trim() || null,
        model: dto.model?.trim() || null,
        description: dto.description?.trim() || null,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice ?? null,
        laboratoryId: dto.laboratoryId,
        condition: dto.condition || EquipmentCondition.GOOD,
        status: dto.status || EquipmentStatus.AVAILABLE,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
      },
      select: EQUIPMENT_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.CREATE,
      entityType: 'Equipment',
      entityId: equipment.id,
      description: `Created equipment ${equipment.name} (${equipment.assetId})`,
      metadata: { name: equipment.name, assetId: equipment.assetId, laboratoryId: equipment.laboratoryId },
    });

    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto, operatorId: string) {
    const existing = await this.findById(id);

    if (dto.serialNumber && dto.serialNumber.trim() !== (existing.serialNumber || '')) {
      const existingSerial = await this.prisma.equipment.findFirst({
        where: {
          serialNumber: dto.serialNumber.trim(),
          id: { not: id },
        },
      });
      if (existingSerial) {
        throw new ConflictException('An equipment with this serial number already exists');
      }
    }

    if (dto.laboratoryId) {
      const laboratory = await this.prisma.laboratory.findUnique({
        where: { id: dto.laboratoryId },
      });
      if (!laboratory) {
        throw new NotFoundException('Laboratory not found');
      }
    }

    const data: Prisma.EquipmentUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.serialNumber !== undefined) data.serialNumber = dto.serialNumber?.trim() || null;
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.manufacturer !== undefined) data.manufacturer = dto.manufacturer?.trim() || null;
    if (dto.model !== undefined) data.model = dto.model?.trim() || null;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.purchaseDate !== undefined) data.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.purchasePrice !== undefined) data.purchasePrice = dto.purchasePrice ?? null;
    if (dto.laboratoryId !== undefined) data.laboratory = { connect: { id: dto.laboratoryId } };
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.warrantyExpiry !== undefined) data.warrantyExpiry = dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null;

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const equipment = await this.prisma.equipment.update({
      where: { id },
      data,
      select: EQUIPMENT_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'Equipment',
      entityId: id,
      description: `Updated equipment ${equipment.name} (${equipment.assetId})`,
      metadata: { fields: Object.keys(data) },
    });

    return equipment;
  }

  async updateStatus(
    id: string,
    dto: UpdateEquipmentStatusDto,
    operatorId: string,
  ) {
    const equipment = await this.findById(id);

    if (equipment.status === dto.status) {
      return equipment;
    }

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: { status: dto.status },
      select: EQUIPMENT_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'Equipment',
      entityId: id,
      description: `Changed status of equipment ${equipment.name} from ${equipment.status} to ${dto.status}`,
      metadata: { previousStatus: equipment.status, newStatus: dto.status },
    });

    return updated;
  }
}
