import { Module } from '@nestjs/common';
import { EquipmentRequestsService } from './equipment-requests.service';
import { EquipmentRequestsController } from './equipment-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [EquipmentRequestsController],
  providers: [EquipmentRequestsService],
  exports: [EquipmentRequestsService],
})
export class EquipmentRequestsModule {}
