import { Module } from '@nestjs/common';
import { ResearchersService } from './researchers.service';
import { ResearchersController } from './researchers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ResearchersController],
  providers: [ResearchersService],
  exports: [ResearchersService],
})
export class ResearchersModule {}
