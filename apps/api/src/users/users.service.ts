import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: string;
  }) {
    const { page, limit, search, role, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto, operatorId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() || null,
        role: dto.role,
        passwordHash,
      },
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      description: `Created user ${user.email} with role ${user.role}`,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, operatorId?: string) {
    await this.findById(id);

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: user.id,
      description: `Updated user ${user.email}`,
      metadata: { fields: Object.keys(data) },
    });

    return user;
  }

  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    operatorId: string,
    operatorRole: UserRole,
  ) {
    if (operatorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles');
    }

    const user = await this.findById(id);

    if (user.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new ForbiddenException(
          'Cannot remove the last active administrator',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: id,
      description: `Changed role of ${user.email} from ${user.role} to ${dto.role}`,
      metadata: { previousRole: user.role, newRole: dto.role },
    });

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    operatorId: string,
  ) {
    const user = await this.findById(id);

    if (user.id === operatorId && !dto.isActive) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: operatorId,
      action: dto.isActive ? AuditAction.UPDATE : AuditAction.DELETE,
      entityType: 'User',
      entityId: id,
      description: `${dto.isActive ? 'Activated' : 'Deactivated'} user ${user.email}`,
    });

    return updated;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdRaw(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
