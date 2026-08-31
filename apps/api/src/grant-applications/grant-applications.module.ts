import { Module } from '@nestjs/common';
import { GrantApplicationsController } from './grant-applications.controller';
import { GrantApplicationsService } from './grant-applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [GrantApplicationsController],
  providers: [
    GrantApplicationsService,
    PrismaService,
    AuditService,
  ],
  exports: [GrantApplicationsService],
})
export class GrantApplicationsModule {}
