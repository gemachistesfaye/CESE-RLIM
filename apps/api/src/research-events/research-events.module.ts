import { Module } from '@nestjs/common';
import { ResearchEventsController } from './research-events.controller';
import { ResearchEventsService } from './research-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResearchEventsController],
  providers: [
    ResearchEventsService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchEventsService],
})
export class ResearchEventsModule {}
