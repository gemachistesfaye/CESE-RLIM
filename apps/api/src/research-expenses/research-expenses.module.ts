import { Module } from '@nestjs/common';
import { ResearchExpensesController } from './research-expenses.controller';
import { ResearchExpensesService } from './research-expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResearchExpensesController],
  providers: [
    ResearchExpensesService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchExpensesService],
})
export class ResearchExpensesModule {}
