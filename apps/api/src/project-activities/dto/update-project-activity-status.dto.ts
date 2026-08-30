import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ActivityStatus } from '@prisma/client';

export class UpdateProjectActivityStatusDto {
  @ApiProperty({ enum: ActivityStatus, description: 'New activity status' })
  @IsEnum(ActivityStatus)
  @IsNotEmpty()
  status!: ActivityStatus;
}
