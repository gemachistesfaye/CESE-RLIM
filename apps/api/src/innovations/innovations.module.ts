import { Module } from '@nestjs/common';
import { InnovationsService } from './innovations.service';
import { InnovationsController } from './innovations.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [InnovationsController],
  providers: [InnovationsService],
  exports: [InnovationsService],
})
export class InnovationsModule {}
