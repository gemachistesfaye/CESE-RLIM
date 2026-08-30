import { Module } from '@nestjs/common';
import { EquipmentAssignmentsService } from './equipment-assignments.service';
import { EquipmentAssignmentsController } from './equipment-assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EquipmentAssignmentsController],
  providers: [EquipmentAssignmentsService],
  exports: [EquipmentAssignmentsService],
})
export class EquipmentAssignmentsModule {}
