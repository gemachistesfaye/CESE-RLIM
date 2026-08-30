import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.DIAGNOSING })
  @IsEnum(MaintenanceStatus)
  @IsNotEmpty()
  status!: MaintenanceStatus;
}
