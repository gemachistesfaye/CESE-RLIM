import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ResearchReportsController } from './research-reports.controller';
import { ResearchReportsService } from './research-reports.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, NotificationsModule],
  controllers: [ResearchReportsController],
  providers: [ResearchReportsService],
  exports: [ResearchReportsService],
})
export class ResearchReportsModule {}
