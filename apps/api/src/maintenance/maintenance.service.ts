import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { UpdateMaintenanceRecordDto } from './dto/update-maintenance-record.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { AuditAction, EquipmentCondition, EquipmentStatus, MaintenanceStatus, Prisma } from '@prisma/client';

const MAINTENANCE_SELECT = {
  id: true,
  equipmentId: true,
  reportedById: true,
  assignedTechnicianId: true,
  reportedByUserId: true,
  maintenanceResearcherId: true,
  problemDescription: true,
  priority: true,
  status: true,
  diagnosis: true,
  actionTaken: true,
  reportedAt: true,
  startedAt: true,
  completedAt: true,
  cost: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  equipment: {
    select: {
      id: true,
      name: true,
      assetId: true,
      serialNumber: true,
      category: true,
      manufacturer: true,
      model: true,
      status: true,
      condition: true,
      laboratory: {
        select: {
          id: true,
          name: true,
          code: true,
          location: true,
        },
      },
    },
  },
  assignedTechnician: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  reportedBy: {
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
} satisfies Prisma.MaintenanceRecordSelect;

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    equipmentId?: string;
    laboratoryId?: string;
    technicianId?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    userRole?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, status, equipmentId, laboratoryId, technicianId, priority, startDate, endDate, userId, userRole, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceRecordWhereInput = {};

    if (userRole === 'TECHNICIAN' && userId) {
      where.assignedTechnicianId = userId;
    }

    if (search) {
      where.OR = [
        { equipment: { name: { contains: search, mode: 'insensitive' } } },
        { equipment: { assetId: { contains: search, mode: 'insensitive' } } },
        { equipment: { serialNumber: { contains: search, mode: 'insensitive' } } },
        { problemDescription: { contains: search, mode: 'insensitive' } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { assignedTechnician: { firstName: { contains: search, mode: 'insensitive' } } },
        { assignedTechnician: { lastName: { contains: search, mode: 'insensitive' } } },
        { equipment: { laboratory: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (status) {
      where.status = status as MaintenanceStatus;
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    if (laboratoryId) {
      where.equipment = { laboratoryId };
    }

    if (technicianId) {
      where.assignedTechnicianId = technicianId;
    }

    if (priority) {
      where.priority = priority as any;
    }

    if (startDate) {
      where.reportedAt = { ...where.reportedAt as any, gte: new Date(startDate) };
    }

    if (endDate) {
      where.reportedAt = { ...where.reportedAt as any, lte: new Date(endDate) };
    }

    const validSortFields = ['createdAt', 'reportedAt', 'priority', 'status', 'cost'];
    const sortField = validSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        select: MAINTENANCE_SELECT,
        skip,
        take: limit,
        orderBy: { [sortField!]: order },
      }),
      this.prisma.maintenanceRecord.count({ where }),
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
    const record = await this.prisma.maintenanceRecord.findUnique({
      where: { id },
      select: MAINTENANCE_SELECT,
    });
    if (!record) {
      throw new NotFoundException('Maintenance record not found');
    }
    return record;
  }

  async findMyMaintenance(params: {
    userId: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceRecordWhereInput = {
      assignedTechnicianId: userId,
    };

    if (status) {
      where.status = status as MaintenanceStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        select: MAINTENANCE_SELECT,
        skip,
        take: limit,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.maintenanceRecord.count({ where }),
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

  async findOverdue(params: {
    userId?: string;
    userRole?: string;
    page: number;
    limit: number;
  }) {
    const { userId, userRole, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceRecordWhereInput = {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      reportedAt: { lt: new Date() },
    };

    if (userRole === 'TECHNICIAN' && userId) {
      where.assignedTechnicianId = userId;
    }

    const [items, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        select: MAINTENANCE_SELECT,
        skip,
        take: limit,
        orderBy: { reportedAt: 'asc' },
      }),
      this.prisma.maintenanceRecord.count({ where }),
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

  async getSummary() {
    const [
      total,
      reported,
      diagnosing,
      repairing,
      testing,
      completed,
      cancelled,
      costAggregate,
      equipmentUnderMaintenance,
    ] = await Promise.all([
      this.prisma.maintenanceRecord.count(),
      this.prisma.maintenanceRecord.count({ where: { status: 'REPORTED' } }),
      this.prisma.maintenanceRecord.count({ where: { status: 'DIAGNOSING' } }),
      this.prisma.maintenanceRecord.count({ where: { status: 'REPAIRING' } }),
      this.prisma.maintenanceRecord.count({ where: { status: 'TESTING' } }),
      this.prisma.maintenanceRecord.count({ where: { status: 'COMPLETED' } }),
      this.prisma.maintenanceRecord.count({ where: { status: 'CANCELLED' } }),
      this.prisma.maintenanceRecord.aggregate({
        _sum: { cost: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.equipment.count({ where: { status: 'UNDER_MAINTENANCE' } }),
    ]);

    const overdue = await this.prisma.maintenanceRecord.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        reportedAt: { lt: new Date() },
      },
    });

    return {
      total,
      reported,
      diagnosing,
      repairing,
      testing,
      completed,
      cancelled,
      overdue,
      totalCost: costAggregate._sum.cost || 0,
      equipmentUnderMaintenance,
    };
  }

  async getEquipmentMaintenanceHistory(equipmentId: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true },
    });
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    const records = await this.prisma.maintenanceRecord.findMany({
      where: { equipmentId },
      select: {
        id: true,
        problemDescription: true,
        priority: true,
        status: true,
        diagnosis: true,
        actionTaken: true,
        reportedAt: true,
        startedAt: true,
        completedAt: true,
        cost: true,
        notes: true,
        assignedTechnician: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { reportedAt: 'desc' },
    });

    return records;
  }

  async create(dto: CreateMaintenanceRecordDto, operatorId: string, userRole: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
      select: { id: true, name: true, assetId: true, status: true },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.status === EquipmentStatus.RETIRED || equipment.status === EquipmentStatus.LOST) {
      throw new BadRequestException(`Cannot create maintenance for equipment with status: ${equipment.status}`);
    }

    const researcher = await this.prisma.researcher.findFirst({
      where: { userId: operatorId },
      select: { id: true },
    });

    if (!researcher && userRole === 'RESEARCHER') {
      throw new ForbiddenException('Only researchers can report maintenance');
    }

    if (dto.assignedTechnicianId) {
      const technician = await this.prisma.user.findUnique({
        where: { id: dto.assignedTechnicianId },
        select: { id: true, role: true },
      });
      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
      if (technician.role !== 'TECHNICIAN') {
        throw new BadRequestException('Assigned user must be a technician');
      }
    }

    const record = await this.prisma.maintenanceRecord.create({
      data: {
        equipmentId: dto.equipmentId,
        reportedById: researcher?.id || '',
        reportedByUserId: operatorId,
        assignedTechnicianId: dto.assignedTechnicianId || null,
        maintenanceResearcherId: dto.maintenanceResearcherId || null,
        problemDescription: dto.problemDescription.trim(),
        priority: dto.priority || 'MEDIUM',
        status: 'REPORTED',
        diagnosis: dto.diagnosis?.trim() || null,
        actionTaken: dto.actionTaken?.trim() || null,
        reportedAt: dto.reportedAt ? new Date(dto.reportedAt) : new Date(),
        cost: dto.cost ?? null,
        notes: dto.notes?.trim() || null,
      },
      select: MAINTENANCE_SELECT,
    });

    await this.prisma.equipment.update({
      where: { id: dto.equipmentId },
      data: { status: EquipmentStatus.UNDER_MAINTENANCE },
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.CREATE,
      entityType: 'MaintenanceRecord',
      entityId: record.id,
      description: `Created maintenance record for ${equipment.name} (${equipment.assetId})`,
      metadata: { equipmentId: dto.equipmentId, equipmentName: equipment.name },
    });

    return record;
  }

  async update(id: string, dto: UpdateMaintenanceRecordDto, operatorId: string) {
    const existing = await this.findById(id);

    if (dto.assignedTechnicianId) {
      const technician = await this.prisma.user.findUnique({
        where: { id: dto.assignedTechnicianId },
        select: { id: true, role: true },
      });
      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
      if (technician.role !== 'TECHNICIAN') {
        throw new BadRequestException('Assigned user must be a technician');
      }
    }

    const data: Prisma.MaintenanceRecordUpdateInput = {};
    if (dto.problemDescription !== undefined) data.problemDescription = dto.problemDescription.trim();
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedTechnicianId !== undefined) {
      data.assignedTechnician = dto.assignedTechnicianId
        ? { connect: { id: dto.assignedTechnicianId } }
        : { disconnect: true };
    }
    if (dto.diagnosis !== undefined) data.diagnosis = dto.diagnosis?.trim() || null;
    if (dto.actionTaken !== undefined) data.actionTaken = dto.actionTaken?.trim() || null;
    if (dto.cost !== undefined) data.cost = dto.cost ?? null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.reportedAt !== undefined) data.reportedAt = new Date(dto.reportedAt);

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const record = await this.prisma.maintenanceRecord.update({
      where: { id },
      data,
      select: MAINTENANCE_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'MaintenanceRecord',
      entityId: id,
      description: `Updated maintenance record for ${existing.equipment.name}`,
      metadata: { fields: Object.keys(data) },
    });

    return record;
  }

  async updateStatus(id: string, dto: UpdateMaintenanceStatusDto, operatorId: string) {
    const existing = await this.findById(id);

    const validTransitions: Record<string, string[]> = {
      'REPORTED': ['DIAGNOSING', 'CANCELLED'],
      'DIAGNOSING': ['REPAIRING', 'CANCELLED'],
      'REPAIRING': ['TESTING', 'CANCELLED'],
      'TESTING': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': [],
    };

    if (!validTransitions[existing.status]?.includes(dto.status)) {
      throw new ConflictException(`Cannot transition from ${existing.status} to ${dto.status}`);
    }

    const updateData: Prisma.MaintenanceRecordUpdateInput = {
      status: dto.status,
    };

    if (dto.status === 'DIAGNOSING' || dto.status === 'REPAIRING' || dto.status === 'TESTING') {
      if (!existing.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    const record = await this.prisma.maintenanceRecord.update({
      where: { id },
      data: updateData,
      select: MAINTENANCE_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'MaintenanceRecord',
      entityId: id,
      description: `Changed maintenance status from ${existing.status} to ${dto.status} for ${existing.equipment.name}`,
      metadata: { previousStatus: existing.status, newStatus: dto.status },
    });

    return record;
  }

  async complete(id: string, dto: CompleteMaintenanceDto, operatorId: string) {
    const existing = await this.findById(id);

    if (existing.status === 'COMPLETED') {
      throw new ConflictException('Maintenance is already completed');
    }

    if (existing.status === 'CANCELLED') {
      throw new ConflictException('Cannot complete cancelled maintenance');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          actionTaken: dto.actionTaken?.trim() || existing.actionTaken,
          cost: dto.cost ?? existing.cost,
          notes: dto.notes?.trim() || existing.notes,
        },
        select: MAINTENANCE_SELECT,
      });

      if (dto.conditionAfter) {
        let newEquipmentStatus: EquipmentStatus = EquipmentStatus.AVAILABLE;
        if (dto.conditionAfter === 'DAMAGED') {
          newEquipmentStatus = EquipmentStatus.DAMAGED;
        } else if (dto.conditionAfter === 'POOR') {
          newEquipmentStatus = EquipmentStatus.UNDER_MAINTENANCE;
        }

        await tx.equipment.update({
          where: { id: existing.equipmentId },
          data: {
            condition: dto.conditionAfter,
            status: newEquipmentStatus,
          },
        });
      } else {
        await tx.equipment.update({
          where: { id: existing.equipmentId },
          data: { status: EquipmentStatus.AVAILABLE },
        });
      }

      return record;
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'MaintenanceRecord',
      entityId: id,
      description: `Completed maintenance for ${existing.equipment.name} (${existing.equipment.assetId})`,
      metadata: {
        conditionAfter: dto.conditionAfter,
        cost: dto.cost,
      },
    });

    return result;
  }
}
