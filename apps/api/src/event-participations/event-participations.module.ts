import { Module } from '@nestjs/common';
import { EventParticipationsController } from './event-participations.controller';
import { EventParticipationsService } from './event-participations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [EventParticipationsController],
  providers: [
    EventParticipationsService,
    PrismaService,
    AuditService,
  ],
  exports: [EventParticipationsService],
})
export class EventParticipationsModule {}
