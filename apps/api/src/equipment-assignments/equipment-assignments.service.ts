import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEquipmentAssignmentDto } from './dto/create-equipment-assignment.dto';
import { ReturnEquipmentAssignmentDto } from './dto/return-equipment-assignment.dto';
import { AuditAction, EquipmentStatus, Prisma } from '@prisma/client';

const ASSIGNMENT_SELECT = {
  id: true,
  equipmentId: true,
  researcherId: true,
  researchProjectId: true,
  requestId: true,
  issuedById: true,
  issuedAt: true,
  expectedReturnAt: true,
  returnedAt: true,
  receivedById: true,
  conditionAtIssue: true,
  conditionAtReturn: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  equipment: {
    select: {
      id: true,
      name: true,
      assetId: true,
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
  request: {
    select: {
      id: true,
      purpose: true,
      startDate: true,
      expectedReturnDate: true,
      priority: true,
      status: true,
    },
  },
} satisfies Prisma.EquipmentAssignmentSelect;

@Injectable()
export class EquipmentAssignmentsService {
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
    researcherId?: string;
    laboratoryId?: string;
    userId?: string;
    userRole?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, status, equipmentId, researcherId, laboratoryId, userId, userRole, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipmentAssignmentWhereInput = {};

    if (userRole === 'RESEARCHER' && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (researcher) {
        where.researcherId = researcher.id;
      } else {
        return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
    } else if (researcherId) {
      where.researcherId = researcherId;
    }

    if (search) {
      where.OR = [
        { equipment: { name: { contains: search, mode: 'insensitive' } } },
        { equipment: { assetId: { contains: search, mode: 'insensitive' } } },
        { researcher: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { researcher: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    if (laboratoryId) {
      where.equipment = { laboratoryId };
    }

    if (status === 'ACTIVE') {
      where.returnedAt = null;
    } else if (status === 'RETURNED') {
      where.returnedAt = { not: null };
    }

    const validSortFields = ['createdAt', 'issuedAt', 'expectedReturnAt', 'returnedAt'];
    const sortField = validSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      this.prisma.equipmentAssignment.findMany({
        where,
        select: ASSIGNMENT_SELECT,
        skip,
        take: limit,
        orderBy: { [sortField!]: order },
      }),
      this.prisma.equipmentAssignment.count({ where }),
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

  async findById(id: string, userId?: string, userRole?: string) {
    const assignment = await this.prisma.equipmentAssignment.findUnique({
      where: { id },
      select: ASSIGNMENT_SELECT,
    });

    if (!assignment) {
      throw new NotFoundException('Equipment assignment not found');
    }

    if (userRole === 'RESEARCHER' && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher || assignment.researcherId !== researcher.id) {
        throw new ForbiddenException('You are not authorized to view this assignment');
      }
    }

    return assignment;
  }

  async create(dto: CreateEquipmentAssignmentDto, operatorId: string) {
    const request = await this.prisma.equipmentRequest.findUnique({
      where: { id: dto.requestId },
      select: {
        id: true,
        requesterId: true,
        equipmentId: true,
        status: true,
        startDate: true,
        expectedReturnDate: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Equipment request not found');
    }

    if (request.status !== 'APPROVED') {
      throw new ConflictException(`Cannot assign equipment for request with status: ${request.status}`);
    }

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: request.equipmentId },
      select: { id: true, name: true, assetId: true, status: true },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.status !== EquipmentStatus.AVAILABLE) {
      throw new BadRequestException(`Equipment is not available for assignment. Current status: ${equipment.status}`);
    }

    const activeAssignment = await this.prisma.equipmentAssignment.findFirst({
      where: {
        equipmentId: request.equipmentId,
        returnedAt: null,
      },
    });

    if (activeAssignment) {
      throw new ConflictException('Equipment already has an active assignment');
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: operatorId },
      select: { id: true },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const issuedAt = new Date(dto.issuedAt);
    const expectedReturnAt = new Date(dto.expectedReturnAt);

    const result = await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.equipmentAssignment.create({
        data: {
          equipmentId: request.equipmentId,
          researcherId: request.requesterId,
          requestId: request.id,
          issuedById: operatorId,
          issuedAt,
          expectedReturnAt,
          conditionAtIssue: dto.conditionAtIssue || null,
          notes: dto.notes?.trim() || null,
        },
        select: ASSIGNMENT_SELECT,
      });

      await tx.equipment.update({
        where: { id: request.equipmentId },
        data: { status: EquipmentStatus.IN_USE },
      });

      await tx.equipmentRequest.update({
        where: { id: request.id },
        data: { status: 'ISSUED' },
      });

      return assignment;
    });

    const requester = await this.prisma.researcher.findUnique({
      where: { id: request.requesterId },
      select: { user: { select: { firstName: true, lastName: true } } },
    });

    const requesterName = requester ? `${requester.user.firstName} ${requester.user.lastName}` : 'Unknown';

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.ISSUE,
      entityType: 'EquipmentAssignment',
      entityId: result.id,
      description: `Assigned equipment ${equipment.name} (${equipment.assetId}) to ${requesterName}`,
      metadata: {
        equipmentId: request.equipmentId,
        equipmentName: equipment.name,
        requesterId: request.requesterId,
        requesterName,
      },
    });

    return result;
  }

  async returnEquipment(id: string, dto: ReturnEquipmentAssignmentDto, operatorId: string) {
    const assignment = await this.prisma.equipmentAssignment.findUnique({
      where: { id },
      select: {
        ...ASSIGNMENT_SELECT,
        returnedAt: true,
        equipmentId: true,
        requestId: true,
        researcherId: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Equipment assignment not found');
    }

    if (assignment.returnedAt) {
      throw new ConflictException('Equipment has already been returned');
    }

    const returnedAt = new Date(dto.returnedAt);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentAssignment.update({
        where: { id },
        data: {
          returnedAt,
          receivedById: operatorId,
          conditionAtReturn: dto.conditionAtReturn || null,
          notes: dto.notes?.trim() || assignment.notes,
        },
        select: ASSIGNMENT_SELECT,
      });

      let newEquipmentStatus: EquipmentStatus = EquipmentStatus.AVAILABLE;
      if (dto.conditionAtReturn === 'DAMAGED') {
        newEquipmentStatus = EquipmentStatus.DAMAGED;
      } else if (dto.conditionAtReturn === 'POOR') {
        newEquipmentStatus = EquipmentStatus.UNDER_MAINTENANCE;
      }

      await tx.equipment.update({
        where: { id: assignment.equipmentId },
        data: { status: newEquipmentStatus },
      });

      if (assignment.requestId) {
        await tx.equipmentRequest.update({
          where: { id: assignment.requestId },
          data: { status: 'RETURNED' },
        });
      }

      return updated;
    });

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: assignment.equipmentId },
      select: { name: true, assetId: true },
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.RETURN,
      entityType: 'EquipmentAssignment',
      entityId: id,
      description: `Returned equipment ${equipment?.name} (${equipment?.assetId})`,
      metadata: {
        equipmentId: assignment.equipmentId,
        conditionAtReturn: dto.conditionAtReturn,
      },
    });

    return result;
  }
}
