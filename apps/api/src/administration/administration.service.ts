import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto/system-settings.dto';

@Injectable()
export class AdministrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      totalResearchers,
      totalLaboratories,
      totalEquipment,
      totalProjects,
      totalPublications,
      totalDocuments,
      totalInnovations,
      pendingEthics,
      pendingEquipmentRequests,
      pendingGrantApplications,
      activeGrants,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.researcher.count(),
      this.prisma.laboratory.count(),
      this.prisma.equipment.count(),
      this.prisma.researchProject.count(),
      this.prisma.researchPublication.count(),
      this.prisma.researchDocument.count(),
      this.prisma.innovation.count(),
      this.prisma.ethicsApplication.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.equipmentRequest.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.grantApplication.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.researchGrant.count({ where: { status: 'ACTIVE' } }),
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
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const roleDistribution = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    return {
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers, byRole: roleDistribution },
      researchers: totalResearchers,
      laboratories: totalLaboratories,
      equipment: totalEquipment,
      projects: totalProjects,
      publications: totalPublications,
      documents: totalDocuments,
      innovations: totalInnovations,
      pendingOperations: {
        ethicsApplications: pendingEthics,
        equipmentRequests: pendingEquipmentRequests,
        grantApplications: pendingGrantApplications,
      },
      activeGrants,
      recentActivity,
    };
  }

  async getSystemInfo() {
    return {
      applicationName: 'CESE-RLIM',
      applicationVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      apiVersion: 'v1',
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      uptime: process.uptime(),
    };
  }

  async getHealth() {
    let databaseStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'disconnected';
    }

    return {
      status: databaseStatus === 'connected' ? 'healthy' : 'degraded',
      database: databaseStatus,
      api: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  async getAllSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return setting;
  }

  async getPublicSettings() {
    return this.prisma.systemSetting.findMany({
      where: { isPublic: true },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
      select: {
        key: true,
        value: true,
        description: true,
        category: true,
      },
    });
  }

  async createSetting(dto: CreateSystemSettingDto, userId: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new BadRequestException(`Setting '${dto.key}' already exists`);
    }

    const setting = await this.prisma.systemSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        description: dto.description,
        category: dto.category || 'general',
        isPublic: dto.isPublic || false,
        updatedById: userId,
      },
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'SystemSetting',
      entityId: setting.key,
      description: `Created system setting: ${setting.key}`,
      metadata: { value: setting.value, category: setting.category },
    });

    return setting;
  }

  async updateSetting(key: string, dto: UpdateSystemSettingDto, userId: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    const updateData: Prisma.SystemSettingUpdateInput = {
      value: dto.value,
      updatedBy: { connect: { id: userId } },
    };

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.isPublic !== undefined) updateData.isPublic = dto.isPublic;

    const setting = await this.prisma.systemSetting.update({
      where: { key },
      data: updateData,
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'SystemSetting',
      entityId: key,
      description: `Updated system setting: ${key}`,
      metadata: {
        previousValue: existing.value,
        newValue: dto.value,
        previousDescription: existing.description,
        newDescription: dto.description,
      },
    });

    return setting;
  }

  async deleteSetting(key: string, userId: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    await this.prisma.systemSetting.delete({ where: { key } });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'SystemSetting',
      entityId: key,
      description: `Deleted system setting: ${key}`,
      metadata: { value: existing.value, category: existing.category },
    });

    return { success: true, message: `Setting '${key}' deleted` };
  }
}
