import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InnovationStatus } from '@prisma/client';

export class UpdateInnovationStatusDto {
  @ApiProperty({ enum: InnovationStatus, example: InnovationStatus.APPROVED })
  @IsEnum(InnovationStatus)
  @IsNotEmpty()
  status!: InnovationStatus;
}
