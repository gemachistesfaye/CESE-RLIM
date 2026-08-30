import { Module } from '@nestjs/common';
import { ResearchGrantsController } from './research-grants.controller';
import { ResearchGrantsService } from './research-grants.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResearchGrantsController],
  providers: [
    ResearchGrantsService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchGrantsService],
})
export class ResearchGrantsModule {}
