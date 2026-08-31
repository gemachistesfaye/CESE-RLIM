import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, EventStatus, ParticipationStatus, UserRole } from '@prisma/client';
import { CreateEventParticipationDto } from './dto/create-event-participation.dto';

const PARTICIPATION_SELECT = {
  id: true,
  eventId: true,
  researcherId: true,
  status: true,
  registeredAt: true,
  confirmedAt: true,
  attendedAt: true,
  cancelledAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  event: { select: { id: true, eventCode: true, title: true, eventType: true, status: true, startDate: true, endDate: true, venue: true, location: true, isVirtual: true, meetingUrl: true } },
  researcher: { select: { id: true, userId: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
};

@Injectable()
export class EventParticipationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    eventId?: string;
    researcherId?: string;
    status?: string;
    userId?: string;
    userRole?: UserRole;
  }) {
    const { page, limit, eventId, researcherId, status, userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (eventId) where.eventId = eventId;
    if (researcherId) where.researcherId = researcherId;
    if (status) where.status = status as ParticipationStatus;

    if (userId && userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
      if (researcher) {
        where.researcherId = researcher.id;
      } else {
        where.id = '__nonexistent__';
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.eventParticipation.findMany({
        where,
        select: PARTICIPATION_SELECT,
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
      }),
      this.prisma.eventParticipation.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMyParticipations(params: { userId: string; page: number; limit: number; status?: string }) {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const researcher = await this.prisma.researcher.findUnique({ where: { userId }, select: { id: true } });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const where: Record<string, unknown> = { researcherId: researcher.id };
    if (status) where.status = status as ParticipationStatus;

    const [items, total] = await Promise.all([
      this.prisma.eventParticipation.findMany({
        where,
        select: PARTICIPATION_SELECT,
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
      }),
      this.prisma.eventParticipation.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const participation = await this.prisma.eventParticipation.findUnique({
      where: { id },
      select: PARTICIPATION_SELECT,
    });

    if (!participation) {
      throw new NotFoundException('Event participation not found');
    }

    return participation;
  }

  async register(dto: CreateEventParticipationDto, userId: string) {
    const event = await this.prisma.researchEvent.findUnique({ where: { id: dto.eventId } });
    if (!event) {
      throw new NotFoundException('Research event not found');
    }

    const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
    if (!researcher) {
      throw new NotFoundException('Researcher profile not found');
    }

    const openStatuses: EventStatus[] = [EventStatus.REGISTRATION_OPEN];
    if (!openStatuses.includes(event.status)) {
      throw new BadRequestException('Registration is not open for this event');
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      throw new ConflictException('Event has reached maximum capacity');
    }

    const existing = await this.prisma.eventParticipation.findUnique({
      where: { eventId_researcherId: { eventId: dto.eventId, researcherId: researcher.id } },
    });

    if (existing) {
      if (existing.status === ParticipationStatus.CANCELLED) {
        const participation = await this.prisma.$transaction([
          this.prisma.eventParticipation.update({
            where: { id: existing.id },
            data: { status: ParticipationStatus.REGISTERED, registeredAt: new Date(), cancelledAt: null },
          }),
          this.prisma.researchEvent.update({
            where: { id: dto.eventId },
            data: { currentParticipants: { increment: 1 } },
          }),
        ]);

        await this.auditService.log({
          userId,
          action: AuditAction.CREATE,
          entityType: 'EventParticipation',
          entityId: existing.id,
          description: `Re-registered for event ${event.eventCode}`,
          metadata: { eventCode: event.eventCode, eventId: dto.eventId },
        });

        return this.findById(existing.id);
      }
      throw new ConflictException('Already registered for this event');
    }

    const [participation] = await this.prisma.$transaction([
      this.prisma.eventParticipation.create({
        data: {
          eventId: dto.eventId,
          researcherId: researcher.id,
          status: ParticipationStatus.REGISTERED,
          notes: dto.notes,
        },
      }),
      this.prisma.researchEvent.update({
        where: { id: dto.eventId },
        data: { currentParticipants: { increment: 1 } },
      }),
    ]);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'EventParticipation',
      entityId: participation.id,
      description: `Registered for event ${event.eventCode}`,
      metadata: { eventCode: event.eventCode, eventId: dto.eventId },
    });

    return this.findById(participation.id);
  }

  async cancel(id: string, userId: string, userRole: UserRole) {
    const participation = await this.prisma.eventParticipation.findUnique({ where: { id } });
    if (!participation) {
      throw new NotFoundException('Event participation not found');
    }

    if (userRole === UserRole.RESEARCHER) {
      const researcher = await this.prisma.researcher.findUnique({ where: { userId } });
      if (!researcher || participation.researcherId !== researcher.id) {
        throw new ForbiddenException('You can only cancel your own registration');
      }
    }

    if (participation.status === ParticipationStatus.CANCELLED) {
      throw new BadRequestException('Registration is already cancelled');
    }

    const event = await this.prisma.researchEvent.findUnique({ where: { id: participation.eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.$transaction([
      this.prisma.eventParticipation.update({
        where: { id },
        data: { status: ParticipationStatus.CANCELLED, cancelledAt: new Date() },
      }),
      this.prisma.researchEvent.update({
        where: { id: participation.eventId },
        data: { currentParticipants: { decrement: 1 } },
      }),
    ]);

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'EventParticipation',
      entityId: id,
      description: `Cancelled registration for event ${event.eventCode}`,
      metadata: { eventCode: event.eventCode, eventId: participation.eventId, previousStatus: participation.status },
    });

    return this.findById(id);
  }

  async updateStatus(id: string, newStatus: ParticipationStatus, userId: string) {
    const participation = await this.prisma.eventParticipation.findUnique({ where: { id } });
    if (!participation) {
      throw new NotFoundException('Event participation not found');
    }

    const event = await this.prisma.researchEvent.findUnique({ where: { id: participation.eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (newStatus === ParticipationStatus.CONFIRMED && participation.status !== ParticipationStatus.REGISTERED) {
      throw new BadRequestException('Can only confirm registered participants');
    }

    if (newStatus === ParticipationStatus.ATTENDED && participation.status !== ParticipationStatus.CONFIRMED) {
      throw new BadRequestException('Can only mark confirmed participants as attended');
    }

    if (newStatus === ParticipationStatus.NO_SHOW && participation.status !== ParticipationStatus.CONFIRMED) {
      throw new BadRequestException('Can only mark confirmed participants as no-show');
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === ParticipationStatus.CONFIRMED) updateData.confirmedAt = new Date();
    if (newStatus === ParticipationStatus.ATTENDED) updateData.attendedAt = new Date();

    await this.prisma.eventParticipation.update({ where: { id }, data: updateData });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'EventParticipation',
      entityId: id,
      description: `Changed participation status to ${newStatus} for event ${event.eventCode}`,
      metadata: { eventCode: event.eventCode, eventId: participation.eventId, previousStatus: participation.status, newStatus },
    });

    return this.findById(id);
  }
}
