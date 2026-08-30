import { Module } from '@nestjs/common';
import { ResearchProjectsService } from './research-projects.service';
import { ResearchProjectsController } from './research-projects.controller';

@Module({
  controllers: [ResearchProjectsController],
  providers: [ResearchProjectsService],
  exports: [ResearchProjectsService],
})
export class ResearchProjectsModule {}
