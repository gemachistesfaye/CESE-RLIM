import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { EquipmentCondition } from '@prisma/client';

export class UpdateEquipmentDto {
  @ApiPropertyOptional({ example: 'Oscilloscope' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'SN-2024-00123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'Measurement Instruments' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'Tektronix' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'TBS1102C' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: 'Digital storage oscilloscope for signal analysis' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 12500.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 'uuid-of-laboratory' })
  @IsOptional()
  @IsString()
  laboratoryId?: string;

  @ApiPropertyOptional({ enum: EquipmentCondition, example: EquipmentCondition.GOOD })
  @IsOptional()
  @IsEnum(EquipmentCondition)
  condition?: EquipmentCondition;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;
}
