import { Module } from '@nestjs/common';
import { FundingOpportunitiesController } from './funding-opportunities.controller';
import { FundingOpportunitiesService } from './funding-opportunities.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [FundingOpportunitiesController],
  providers: [
    FundingOpportunitiesService,
    PrismaService,
    AuditService,
  ],
  exports: [FundingOpportunitiesService],
})
export class FundingOpportunitiesModule {}
