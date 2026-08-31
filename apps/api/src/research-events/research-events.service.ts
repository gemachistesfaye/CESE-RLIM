import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, EventStatus, EventType, ParticipationStatus, UserRole } from '@prisma/client';
import { CreateResearchEventDto } from './dto/create-research-event.dto';
import { UpdateResearchEventDto } from './dto/update-research-event.dto';

const EVENT_SELECT = {
  id: true,
  eventCode: true,
  title: true,
  description: true,
  eventType: true,
  status: true,
  startDate: true,
  endDate: true,
  registrationDeadline: true,
  venue: true,
  location: true,
  isVirtual: true,
  meetingUrl: true,
  organizer: true,
  contactEmail: true,
  contactPhone: true,
  maxParticipants: true,
  currentParticipants: true,
  researchProjectId: true,
  innovationId: true,
  publicationId: true,
  objectives: true,
  eligibility: true,
  requirements: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  researchProject: { select: { id: true, projectCode: true, title: true } },
  innovation: { select: { id: true, title: true, developmentStage: true } },
  publication: { select: { id: true, title: true, publicationType: true, status: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  participations: {
    select: {
      id: true,
      status: true,
      registeredAt: true,
      confirmedAt: true,
      attendedAt: true,
      cancelledAt: true,
      researcher: { select: { id: true, userId: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
    orderBy: { registeredAt: 'desc' as const },
  },
};

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  PUBLISHED: [EventStatus.REGISTRATION_OPEN, EventStatus.CANCELLED],
  REGISTRATION_OPEN: [EventStatus.REGISTRATION_CLOSED, EventStatus.CANCELLED],
  REGISTRATION_CLOSED: [EventStatus.ONGOING, EventStatus.CANCELLED],
  ONGOING: [EventStatus.COMPLETED, EventStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ResearchEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    eventType?: string;
    isVirtual?: string;
    startDate?: string;
    endDate?: string;
    upcoming?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, status, eventType, isVirtual, startDate, endDate, upcoming, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status as EventStatus;
    }

    if (eventType) {
      where.eventType = eventType as EventType;
    }

    if (isVirtual !== undefined) {
      where.isVirtual = isVirtual === 'true';
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
      where.status = { in: [EventStatus.PUBLISHED, EventStatus.REGISTRATION_OPEN, EventStatus.REGISTRATION_CLOSED] };
    }

    if (search) {
      where.OR = [
        { eventCode: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { organizer: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    if (['eventCode', 'title', 'status', 'eventType', 'startDate', 'endDate', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'participants') {
      orderBy.currentParticipants = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total] = await Promise.all([
      this.prisma.researchEvent.findMany({
        where,
        select: EVENT_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.researchEvent.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const event = await this.prisma.researchEvent.findUnique({
      where: { id },
      select: EVENT_SELECT,
    });

    if (!event) {
      throw new NotFoundException('Research event not found');
    }

    return event;
  }

  async getSummary() {
    const now = new Date();
    const [total, draft, published, registrationOpen, ongoing, completed, cancelled, totalParticipants] = await Promise.all([
      this.prisma.researchEvent.count(),
      this.prisma.researchEvent.count({ where: { status: EventStatus.DRAFT } }),
      this.prisma.researchEvent.count({ where: { status: EventStatus.PUBLISHED } }),
      this.prisma.researchEvent.count({ where: { status: EventStatus.REGISTRATION_OPEN } }),
      this.prisma.researchEvent.count({ where: { status: EventStatus.ONGOING } }),
      this.prisma.researchEvent.count({ where: { status: EventStatus.COMPLETED } }),
      this.prisma.researchEvent.count({ where: { status: EventStatus.CANCELLED } }),
      this.prisma.eventParticipation.count({ where: { status: { in: [ParticipationStatus.CONFIRMED, ParticipationStatus.ATTENDED] } } }),
    ]);

    const upcoming = await this.prisma.researchEvent.count({
      where: {
        startDate: { gte: now },
        status: { in: [EventStatus.PUBLISHED, EventStatus.REGISTRATION_OPEN, EventStatus.REGISTRATION_CLOSED] },
      },
    });

    const byType = await this.prisma.researchEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
    });

    const eventsByType: Record<string, number> = {};
    byType.forEach(item => { eventsByType[item.eventType] = item._count.id; });

    return { total, draft, published, registrationOpen, upcoming, ongoing, completed, cancelled, totalParticipants, eventsByType };
  }

  async getUpcoming() {
    const now = new Date();
    const items = await this.prisma.researchEvent.findMany({
      where: {
        startDate: { gte: now },
        status: { in: [EventStatus.PUBLISHED, EventStatus.REGISTRATION_OPEN, EventStatus.REGISTRATION_CLOSED] },
      },
      select: {
        id: true,
        eventCode: true,
        title: true,
        eventType: true,
        status: true,
        startDate: true,
        endDate: true,
        venue: true,
        location: true,
        isVirtual: true,
        maxParticipants: true,
        currentParticipants: true,
        organizer: true,
      },
      orderBy: { startDate: 'asc' },
      take: 10,
    });

    return items;
  }

  async getParticipants(eventId: string) {
    const event = await this.prisma.researchEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Research event not found');
    }

    const participants = await this.prisma.eventParticipation.findMany({
      where: { eventId },
      select: {
        id: true,
        status: true,
        registeredAt: true,
        confirmedAt: true,
        attendedAt: true,
        cancelledAt: true,
        notes: true,
        researcher: { select: { id: true, userId: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return participants;
  }

  async create(dto: CreateResearchEventDto, userId: string) {
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    if (dto.registrationDeadline && new Date(dto.registrationDeadline) > new Date(dto.startDate)) {
      throw new BadRequestException('Registration deadline must not be after event start date');
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
      if (!project) throw new NotFoundException('Research project not found');
    }

    if (dto.innovationId) {
      const innovation = await this.prisma.innovation.findUnique({ where: { id: dto.innovationId } });
      if (!innovation) throw new NotFoundException('Innovation not found');
    }

    if (dto.publicationId) {
      const publication = await this.prisma.researchPublication.findUnique({ where: { id: dto.publicationId } });
      if (!publication) throw new NotFoundException('Publication not found');
    }

    const count = await this.prisma.researchEvent.count();
    const eventCode = `EVT-${String(count + 1).padStart(4, '0')}`;

    const event = await this.prisma.researchEvent.create({
      data: {
        eventCode,
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        status: EventStatus.DRAFT,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null,
        venue: dto.venue,
        location: dto.location,
        isVirtual: dto.isVirtual || false,
        meetingUrl: dto.meetingUrl,
        organizer: dto.organizer,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        maxParticipants: dto.maxParticipants,
        researchProjectId: dto.researchProjectId || null,
        innovationId: dto.innovationId || null,
        publicationId: dto.publicationId || null,
        objectives: dto.objectives,
        eligibility: dto.eligibility,
        requirements: dto.requirements,
        createdById: userId,
      },
      select: EVENT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ResearchEvent',
      entityId: event.id,
      description: `Created research event ${eventCode}`,
      metadata: { eventCode, eventType: dto.eventType, title: dto.title },
    });

    return event;
  }

  async update(id: string, dto: UpdateResearchEventDto, userId: string) {
    const existing = await this.prisma.researchEvent.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Research event not found');
    }

    if (existing.status !== EventStatus.DRAFT && existing.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Can only edit draft or published events');
    }

    if (dto.startDate || dto.endDate) {
      const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;
      const end = dto.endDate ? new Date(dto.endDate) : existing.endDate;
      if (end <= start) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    if (dto.registrationDeadline && dto.startDate) {
      if (new Date(dto.registrationDeadline) > new Date(dto.startDate)) {
        throw new BadRequestException('Registration deadline must not be after event start date');
      }
    }

    if (dto.researchProjectId) {
      const project = await this.prisma.researchProject.findUnique({ where: { id: dto.researchProjectId } });
      if (!project) throw new NotFoundException('Research project not found');
    }

    if (dto.innovationId) {
      const innovation = await this.prisma.innovation.findUnique({ where: { id: dto.innovationId } });
      if (!innovation) throw new NotFoundException('Innovation not found');
    }

    if (dto.publicationId) {
      const publication = await this.prisma.researchPublication.findUnique({ where: { id: dto.publicationId } });
      if (!publication) throw new NotFoundException('Publication not found');
    }

    const event = await this.prisma.researchEvent.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.eventType && { eventType: dto.eventType }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.registrationDeadline !== undefined && { registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null }),
        ...(dto.venue !== undefined && { venue: dto.venue }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isVirtual !== undefined && { isVirtual: dto.isVirtual }),
        ...(dto.meetingUrl !== undefined && { meetingUrl: dto.meetingUrl }),
        ...(dto.organizer !== undefined && { organizer: dto.organizer }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.maxParticipants !== undefined && { maxParticipants: dto.maxParticipants }),
        ...(dto.researchProjectId !== undefined && { researchProjectId: dto.researchProjectId || null }),
        ...(dto.innovationId !== undefined && { innovationId: dto.innovationId || null }),
        ...(dto.publicationId !== undefined && { publicationId: dto.publicationId || null }),
        ...(dto.objectives !== undefined && { objectives: dto.objectives }),
        ...(dto.eligibility !== undefined && { eligibility: dto.eligibility }),
        ...(dto.requirements !== undefined && { requirements: dto.requirements }),
      },
      select: EVENT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ResearchEvent',
      entityId: id,
      description: `Updated research event ${existing.eventCode}`,
      metadata: { eventCode: existing.eventCode, changedFields: Object.keys(dto).filter(k => dto[k as keyof UpdateResearchEventDto] !== undefined) },
    });

    return event;
  }

  async updateStatus(id: string, newStatus: EventStatus, userId: string) {
    const existing = await this.prisma.researchEvent.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Research event not found');
    }

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${newStatus}`);
    }

    const event = await this.prisma.researchEvent.update({
      where: { id },
      data: { status: newStatus },
      select: EVENT_SELECT,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'ResearchEvent',
      entityId: id,
      description: `Changed research event ${existing.eventCode} status to ${newStatus}`,
      metadata: { eventCode: existing.eventCode, previousStatus: existing.status, newStatus },
    });

    return event;
  }

  async getByProject(projectId: string) {
    return this.prisma.researchEvent.findMany({
      where: { researchProjectId: projectId },
      select: {
        id: true,
        eventCode: true,
        title: true,
        eventType: true,
        status: true,
        startDate: true,
        endDate: true,
        venue: true,
        isVirtual: true,
        currentParticipants: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }
}
