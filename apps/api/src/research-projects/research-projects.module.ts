import { Module } from '@nestjs/common';
import { ResearchProjectsService } from './research-projects.service';
import { ResearchProjectsController } from './research-projects.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ResearchProjectsController],
  providers: [ResearchProjectsService],
  exports: [ResearchProjectsService],
})
export class ResearchProjectsModule {}
