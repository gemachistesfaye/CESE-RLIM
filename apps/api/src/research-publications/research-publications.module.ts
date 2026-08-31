import { Module } from '@nestjs/common';
import { ResearchPublicationsController } from './research-publications.controller';
import { ResearchPublicationsService } from './research-publications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ResearchPublicationsController],
  providers: [
    ResearchPublicationsService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchPublicationsService],
})
export class ResearchPublicationsModule {}
