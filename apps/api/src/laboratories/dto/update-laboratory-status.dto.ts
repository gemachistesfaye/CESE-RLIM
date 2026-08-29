import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { LabStatus } from '@prisma/client';

export class UpdateLaboratoryStatusDto {
  @ApiProperty({ enum: LabStatus, example: LabStatus.ACTIVE })
  @IsEnum(LabStatus)
  @IsNotEmpty()
  status!: LabStatus;
}
