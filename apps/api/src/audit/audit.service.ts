import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          description: data.description,
          metadata: data.metadata ? (data.metadata as any) : undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Audit log write failed:', error);
    }
  }
}
