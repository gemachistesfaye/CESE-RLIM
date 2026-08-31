import { Module } from '@nestjs/common';
import { EthicsController } from './ethics.controller';
import { EthicsService } from './ethics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EthicsController],
  providers: [
    EthicsService,
    PrismaService,
    AuditService,
  ],
  exports: [EthicsService],
})
export class EthicsModule {}
