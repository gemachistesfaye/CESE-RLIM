import { Module } from '@nestjs/common';
import { ResearchFinanceController } from './research-finance.controller';
import { ResearchFinanceService } from './research-finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResearchFinanceController],
  providers: [
    ResearchFinanceService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchFinanceService],
})
export class ResearchFinanceModule {}
