import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { RequestPriority } from '@prisma/client';

export class CreateEquipmentRequestDto {
  @ApiProperty({ example: 'uuid-of-equipment' })
  @IsString()
  @IsNotEmpty()
  equipmentId!: string;

  @ApiProperty({ example: 'Need oscilloscope for signal analysis research project' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  purpose!: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  @IsNotEmpty()
  expectedReturnDate!: string;

  @ApiPropertyOptional({ enum: RequestPriority, example: RequestPriority.MEDIUM })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ example: 'uuid-of-research-project' })
  @IsOptional()
  @IsString()
  researchProjectId?: string;

  @ApiPropertyOptional({ example: 'Additional notes for the request' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
