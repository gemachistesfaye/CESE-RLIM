import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditAction, Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserQueryDto, UpdateUserStatusDto, ResetUserPasswordDto } from './dto/user-management.dto';

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly USER_SELECT: Prisma.UserSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    role: true,
    status: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll(query: UserQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { researcher: { employeeOrStudentId: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.role) where.role = query.role as UserRole;
    if (query.status) where.status = query.status as UserStatus;

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === 'firstName') orderBy.firstName = sortOrder;
    else if (sortBy === 'email') orderBy.email = sortOrder;
    else if (sortBy === 'role') orderBy.role = sortOrder;
    else if (sortBy === 'status') orderBy.status = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...this.USER_SELECT,
          researcher: {
            select: { id: true, employeeOrStudentId: true, department: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.USER_SELECT,
        researcher: {
          select: {
            id: true,
            employeeOrStudentId: true,
            department: true,
            academicPosition: true,
            expertise: true,
            bio: true,
          },
        },
        _count: {
          select: {
            auditLogs: true,
            notifications: true,
            createdActivities: true,
            uploadedDocuments: true,
            createdPublications: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, operatorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.id === operatorId) {
      throw new ForbiddenException('Cannot change your own account status');
    }

    if (dto.status !== 'ACTIVE') {
      const activeAdmins = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, id: { not: id } },
      });
      if (user.role === UserRole.ADMIN && activeAdmins === 0) {
        throw new ForbiddenException('Cannot deactivate or suspend the last active admin');
      }
    }

    const oldStatus = user.status;
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status as UserStatus,
        isActive: dto.status === 'ACTIVE',
      },
      select: this.USER_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'User',
      entityId: id,
      description: `Account status changed from ${oldStatus} to ${dto.status}`,
      metadata: { targetUserId: id, targetUserName: `${user.firstName} ${user.lastName}`, oldStatus, newStatus: dto.status },
    });

    const notificationType = dto.status === 'ACTIVE' ? 'SUCCESS' : dto.status === 'SUSPENDED' ? 'WARNING' : 'INFO';
    await this.notificationsService.create({
      userId: id,
      type: notificationType,
      title: `Account ${dto.status.toLowerCase()}`,
      message: dto.status === 'ACTIVE'
        ? 'Your account has been activated. You can now access the platform.'
        : dto.status === 'SUSPENDED'
        ? 'Your account has been suspended. Please contact an administrator.'
        : 'Your account has been deactivated. Please contact an administrator.',
      entityType: 'User',
      entityId: id,
    });

    return updated;
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto, operatorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: id,
      description: 'Password reset by administrator',
      metadata: { targetUserId: id, targetUserName: `${user.firstName} ${user.lastName}` },
    });

    await this.notificationsService.create({
      userId: id,
      type: 'WARNING',
      title: 'Password Reset',
      message: 'Your password has been reset by an administrator. Please log in with your new password.',
      entityType: 'User',
      entityId: id,
    });

    return { success: true, message: 'Password reset successfully' };
  }

  async getUserActivity(id: string, query: { page?: string; limit?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 50);

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where: { userId: id } }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSummary() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      admins,
      coordinators,
      researchers,
      technicians,
      recentRegistrations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { role: UserRole.COORDINATOR } }),
      this.prisma.user.count({ where: { role: UserRole.RESEARCHER } }),
      this.prisma.user.count({ where: { role: UserRole.TECHNICIAN } }),
      this.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      admins,
      coordinators,
      researchers,
      technicians,
      recentRegistrations,
    };
  }

  async getSecuritySummary() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      inactiveUsers,
      admins,
      coordinators,
      researchers,
      technicians,
      recentRoleChanges,
      recentStatusChanges,
      recentLogins,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { role: UserRole.COORDINATOR, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { role: UserRole.RESEARCHER, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE } }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'User', action: AuditAction.UPDATE, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, action: true, description: true, createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'User', action: AuditAction.STATUS_CHANGE, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, description: true, metadata: true, createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { lastLoginAt: { gte: sevenDaysAgo } },
        orderBy: { lastLoginAt: 'desc' },
        take: 10,
        select: {
          id: true, firstName: true, lastName: true, email: true, lastLoginAt: true, role: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, action: true, entityType: true, description: true, createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      inactiveUsers,
      adminCount: admins,
      coordinatorCount: coordinators,
      researcherCount: researchers,
      technicianCount: technicians,
      recentRoleChanges,
      recentStatusChanges,
      recentLogins,
      recentActivity,
    };
  }
}
