import { Module } from '@nestjs/common';
import { ResearchProjectMembersController } from './research-project-members.controller';
import { ResearchProjectMembersService } from './research-project-members.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResearchProjectMembersController],
  providers: [
    ResearchProjectMembersService,
    PrismaService,
    AuditService,
  ],
  exports: [ResearchProjectMembersService],
})
export class ResearchProjectMembersModule {}
