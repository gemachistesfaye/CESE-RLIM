import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

export class UpdateEquipmentStatusDto {
  @ApiProperty({ enum: EquipmentStatus, example: EquipmentStatus.IN_USE })
  @IsEnum(EquipmentStatus)
  @IsNotEmpty()
  status!: EquipmentStatus;
}
