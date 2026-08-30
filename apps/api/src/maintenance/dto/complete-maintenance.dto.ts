import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, MaxLength, Min } from 'class-validator';
import { EquipmentCondition } from '@prisma/client';

export class CompleteMaintenanceDto {
  @ApiPropertyOptional({ example: 'Replaced faulty component and tested' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actionTaken?: string;

  @ApiPropertyOptional({ example: 200.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'Maintenance completed successfully' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ enum: EquipmentCondition, example: EquipmentCondition.GOOD })
  @IsOptional()
  @IsEnum(EquipmentCondition)
  conditionAfter?: EquipmentCondition;
}
