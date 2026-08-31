import { Module } from '@nestjs/common';
import { BudgetAllocationsController } from './budget-allocations.controller';
import { BudgetAllocationsService } from './budget-allocations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [BudgetAllocationsController],
  providers: [
    BudgetAllocationsService,
    PrismaService,
    AuditService,
  ],
  exports: [BudgetAllocationsService],
})
export class BudgetAllocationsModule {}
