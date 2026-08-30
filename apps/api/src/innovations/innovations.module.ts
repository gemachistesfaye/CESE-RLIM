import { Module } from '@nestjs/common';
import { InnovationsService } from './innovations.service';
import { InnovationsController } from './innovations.controller';

@Module({
  controllers: [InnovationsController],
  providers: [InnovationsService],
  exports: [InnovationsService],
})
export class InnovationsModule {}
