import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEquipmentRequestDto } from './dto/create-equipment-request.dto';
import { ReviewEquipmentRequestDto, ReviewAction } from './dto/review-equipment-request.dto';
import { AuditAction, RequestStatus, EquipmentStatus, Prisma } from '@prisma/client';

const REQUEST_SELECT = {
  id: true,
  requesterId: true,
  equipmentId: true,
  researchProjectId: true,
  purpose: true,
  startDate: true,
  expectedReturnDate: true,
  priority: true,
  status: true,
  reviewComment: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
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
  assignment: {
    select: {
      id: true,
      issuedAt: true,
      expectedReturnAt: true,
      returnedAt: true,
      conditionAtIssue: true,
      conditionAtReturn: true,
      notes: true,
    },
  },
} satisfies Prisma.EquipmentRequestSelect;

@Injectable()
export class EquipmentRequestsService {
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
    requesterId?: string;
    priority?: string;
    userId?: string;
    userRole?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, status, equipmentId, requesterId, priority, userId, userRole, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipmentRequestWhereInput = {};

    if (userRole === 'RESEARCHER' && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (researcher) {
        where.requesterId = researcher.id;
      } else {
        return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
    } else if (requesterId) {
      where.requesterId = requesterId;
    }

    if (search) {
      where.OR = [
        { purpose: { contains: search, mode: 'insensitive' } },
        { equipment: { name: { contains: search, mode: 'insensitive' } } },
        { equipment: { assetId: { contains: search, mode: 'insensitive' } } },
        { requester: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { requester: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (status) {
      where.status = status as RequestStatus;
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    if (priority) {
      where.priority = priority as any;
    }

    const validSortFields = ['createdAt', 'startDate', 'expectedReturnDate', 'priority', 'status'];
    const sortField = validSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      this.prisma.equipmentRequest.findMany({
        where,
        select: REQUEST_SELECT,
        skip,
        take: limit,
        orderBy: { [sortField!]: order },
      }),
      this.prisma.equipmentRequest.count({ where }),
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
    const request = await this.prisma.equipmentRequest.findUnique({
      where: { id },
      select: REQUEST_SELECT,
    });

    if (!request) {
      throw new NotFoundException('Equipment request not found');
    }

    if (userRole === 'RESEARCHER' && userId) {
      const researcher = await this.prisma.researcher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!researcher || request.requesterId !== researcher.id) {
        throw new ForbiddenException('You are not authorized to view this request');
      }
    }

    return request;
  }

  async create(dto: CreateEquipmentRequestDto, userId: string) {
    const researcher = await this.prisma.researcher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!researcher) {
      throw new ForbiddenException('Only researchers can submit equipment requests');
    }

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
      select: { id: true, name: true, assetId: true, status: true },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.status !== EquipmentStatus.AVAILABLE) {
      throw new BadRequestException(`Equipment is not available for request. Current status: ${equipment.status}`);
    }

    const startDate = new Date(dto.startDate);
    const expectedReturnDate = new Date(dto.expectedReturnDate);

    if (startDate >= expectedReturnDate) {
      throw new BadRequestException('Start date must be before expected return date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({
        where: { id: dto.researchProjectId },
      });
      if (!project) {
        throw new NotFoundException('Research project not found');
      }
    }

    const request = await this.prisma.equipmentRequest.create({
      data: {
        requesterId: researcher.id,
        equipmentId: dto.equipmentId,
        purpose: dto.purpose.trim(),
        startDate,
        expectedReturnDate,
        priority: dto.priority || 'MEDIUM',
        researchProjectId: dto.researchProjectId || null,
        status: 'SUBMITTED',
      },
      select: REQUEST_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'EquipmentRequest',
      entityId: request.id,
      description: `Created equipment request for ${equipment.name} (${equipment.assetId})`,
      metadata: { equipmentId: dto.equipmentId, equipmentName: equipment.name },
    });

    return request;
  }

  async review(id: string, dto: ReviewEquipmentRequestDto, operatorId: string) {
    const request = await this.prisma.equipmentRequest.findUnique({
      where: { id },
      select: {
        ...REQUEST_SELECT,
        status: true,
        requesterId: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Equipment request not found');
    }

    if (request.status !== 'SUBMITTED' && request.status !== 'UNDER_REVIEW') {
      throw new ConflictException(`Cannot review request with status: ${request.status}`);
    }

    if (dto.action === ReviewAction.REJECT && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const newStatus = dto.action === ReviewAction.APPROVE ? 'APPROVED' : 'REJECTED';
    const auditAction = dto.action === ReviewAction.APPROVE ? AuditAction.APPROVE : AuditAction.REJECT;

    const updated = await this.prisma.equipmentRequest.update({
      where: { id },
      data: {
        status: newStatus as RequestStatus,
        reviewComment: dto.action === ReviewAction.REJECT ? dto.rejectionReason : dto.reviewComment,
        reviewedById: operatorId,
        reviewedAt: new Date(),
      },
      select: REQUEST_SELECT,
    });

    const requester = await this.prisma.researcher.findUnique({
      where: { id: request.requesterId },
      select: { user: { select: { firstName: true, lastName: true } } },
    });

    const requesterName = requester ? `${requester.user.firstName} ${requester.user.lastName}` : 'Unknown';

    await this.auditService.log({
      userId: operatorId,
      action: auditAction,
      entityType: 'EquipmentRequest',
      entityId: id,
      description: `${dto.action === ReviewAction.APPROVE ? 'Approved' : 'Rejected'} equipment request from ${requesterName}`,
      metadata: {
        previousStatus: request.status,
        newStatus,
        rejectionReason: dto.rejectionReason,
      },
    });

    return updated;
  }

  async cancel(id: string, userId: string) {
    const request = await this.prisma.equipmentRequest.findUnique({
      where: { id },
      select: {
        ...REQUEST_SELECT,
        status: true,
        requesterId: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Equipment request not found');
    }

    const researcher = await this.prisma.researcher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!researcher || request.requesterId !== researcher.id) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== 'SUBMITTED' && request.status !== 'UNDER_REVIEW') {
      throw new ConflictException(`Cannot cancel request with status: ${request.status}`);
    }

    const updated = await this.prisma.equipmentRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: REQUEST_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'EquipmentRequest',
      entityId: id,
      description: `Cancelled equipment request`,
      metadata: { previousStatus: request.status, newStatus: 'CANCELLED' },
    });

    return updated;
  }
}
