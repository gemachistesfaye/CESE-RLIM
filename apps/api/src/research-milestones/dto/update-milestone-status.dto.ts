import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class UpdateMilestoneStatusDto {
  @ApiProperty({ enum: MilestoneStatus, description: 'New milestone status' })
  @IsEnum(MilestoneStatus)
  @IsNotEmpty()
  status!: MilestoneStatus;
}
