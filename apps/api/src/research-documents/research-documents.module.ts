import { Module } from '@nestjs/common';
import { ResearchDocumentsController } from './research-documents.controller';
import { ResearchDocumentsService } from './research-documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ResearchDocumentsController],
  providers: [
    ResearchDocumentsService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchDocumentsService],
})
export class ResearchDocumentsModule {}
