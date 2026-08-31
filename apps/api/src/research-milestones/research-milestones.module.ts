import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ResearchMilestonesController } from './research-milestones.controller';
import { ResearchMilestonesService } from './research-milestones.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [ResearchMilestonesController],
  providers: [ResearchMilestonesService],
  exports: [ResearchMilestonesService],
})
export class ResearchMilestonesModule {}
