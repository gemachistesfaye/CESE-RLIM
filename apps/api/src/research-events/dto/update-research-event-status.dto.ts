import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventStatus } from '@prisma/client';

export class UpdateResearchEventStatusDto {
  @ApiProperty({ enum: EventStatus, description: 'New event status' })
  @IsEnum(EventStatus)
  @IsNotEmpty()
  status!: EventStatus;
}
