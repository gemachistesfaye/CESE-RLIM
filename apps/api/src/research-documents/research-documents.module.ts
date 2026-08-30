import { Module } from '@nestjs/common';
import { ResearchDocumentsController } from './research-documents.controller';
import { ResearchDocumentsService } from './research-documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResearchDocumentsController],
  providers: [
    ResearchDocumentsService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchDocumentsService],
})
export class ResearchDocumentsModule {}
