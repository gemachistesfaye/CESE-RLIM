import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Prisma, UserRole } from '@prisma/client';

export interface CreateNotificationData {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  title: true,
  message: true,
  type: true,
  entityType: true,
  entityId: true,
  isRead: true,
  createdAt: true,
  readAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type || NotificationType.INFO,
        title: data.title,
        message: data.message,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
      },
      select: NOTIFICATION_SELECT,
    });
  }

  async createMany(data: CreateNotificationData[]) {
    if (data.length === 0) return;

    return this.prisma.notification.createMany({
      data: data.map((item) => ({
        userId: item.userId,
        type: item.type || NotificationType.INFO,
        title: item.title,
        message: item.message,
        entityType: item.entityType || null,
        entityId: item.entityId || null,
      })),
    });
  }

  async findByUser(params: {
    userId: string;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }) {
    const { userId, page = 1, limit = 20, unreadOnly, type } = params;
    const skip = (page - 1) * limit;
    const safeLimit = Math.min(limit, 100);

    const where: Prisma.NotificationWhereInput = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: NOTIFICATION_SELECT,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: NOTIFICATION_SELECT,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only access your own notifications');
    }

    return notification;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.findById(id, userId);

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      select: NOTIFICATION_SELECT,
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'All notifications marked as read' };
  }

  async remove(id: string, userId: string) {
    await this.findById(id, userId);

    return this.prisma.notification.delete({
      where: { id },
      select: NOTIFICATION_SELECT,
    });
  }

  async findUsersByRole(role: UserRole): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async findUserIdsByResearcherId(researcherId: string): Promise<string[]> {
    const researcher = await this.prisma.researcher.findUnique({
      where: { id: researcherId },
      select: { userId: true },
    });
    return researcher ? [researcher.userId] : [];
  }

  async findProjectMemberUserIds(projectId: string): Promise<string[]> {
    const members = await this.prisma.projectMember.findMany({
      where: { researchProjectId: projectId, isActive: true },
      select: {
        researcher: {
          select: { userId: true },
        },
      },
    });
    return members.map((m) => m.researcher.userId).filter(Boolean);
  }
}
