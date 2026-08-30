import { Module } from '@nestjs/common';
import { EquipmentRequestsService } from './equipment-requests.service';
import { EquipmentRequestsController } from './equipment-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EquipmentRequestsController],
  providers: [EquipmentRequestsService],
  exports: [EquipmentRequestsService],
})
export class EquipmentRequestsModule {}
