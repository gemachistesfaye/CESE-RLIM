import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto) {
    const { page = 1, limit = 20, search, userId, action, entityType, entityId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.AuditLogWhereInput = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    if (sortBy === 'action') orderBy.action = sortOrder;
    else if (sortBy === 'entityType') orderBy.entityType = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) return null;

    const sanitized = this.sanitizeMetadata(log.metadata as Record<string, unknown> | null);

    return { ...log, metadata: sanitized };
  }

  async findByUser(userId: string, query: AuditLogQueryDto) {
    const { page = 1, limit = 20, action, entityType, startDate, endDate, sortOrder = 'desc' } = query;

    const where: Prisma.AuditLogWhereInput = { userId };

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(entityType: string, entityId: string, query: AuditLogQueryDto) {
    const { page = 1, limit = 20, sortOrder = 'desc', startDate, endDate } = query;

    const where: Prisma.AuditLogWhereInput = { entityType, entityId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummary() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEvents,
      todayEvents,
      weekEvents,
      monthEvents,
      actionsByType,
      entityByType,
      recentActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      totalEvents,
      todayEvents,
      weekEvents,
      monthEvents,
      actionsByType: actionsByType.map((a) => ({ action: a.action, count: a._count.action })),
      entityByType: entityByType.map((e) => ({ entityType: e.entityType, count: e._count.entityType })),
      recentActivity,
    };
  }

  private sanitizeMetadata(metadata: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!metadata) return null;

    const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey', 'privateKey', 'credentials', 'jwt'];

    const sanitized = { ...metadata };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
