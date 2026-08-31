import { Module } from '@nestjs/common';
import { ProjectActivitiesController } from './project-activities.controller';
import { ProjectActivitiesService } from './project-activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ProjectActivitiesController],
  providers: [
    ProjectActivitiesService,
    PrismaService,
    AuditService,
  ],
  exports: [ProjectActivitiesService],
})
export class ProjectActivitiesModule {}
