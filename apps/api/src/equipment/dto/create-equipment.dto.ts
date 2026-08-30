import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { EquipmentCondition, EquipmentStatus } from '@prisma/client';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Oscilloscope' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'EQ-OSC-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  assetId!: string;

  @ApiPropertyOptional({ example: 'SN-2024-00123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiProperty({ example: 'Measurement Instruments' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

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

  @ApiProperty({ example: 'uuid-of-laboratory' })
  @IsString()
  @IsNotEmpty()
  laboratoryId!: string;

  @ApiPropertyOptional({ enum: EquipmentCondition, example: EquipmentCondition.GOOD })
  @IsOptional()
  @IsEnum(EquipmentCondition)
  condition?: EquipmentCondition;

  @ApiPropertyOptional({ enum: EquipmentStatus, example: EquipmentStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;
}
