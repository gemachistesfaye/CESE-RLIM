import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsNumber, MaxLength, Min } from 'class-validator';
import { RequestPriority } from '@prisma/client';

export class UpdateMaintenanceRecordDto {
  @ApiPropertyOptional({ example: 'Updated problem description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  problemDescription?: string;

  @ApiPropertyOptional({ enum: RequestPriority, example: RequestPriority.HIGH })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ example: 'uuid-of-technician' })
  @IsOptional()
  @IsString()
  assignedTechnicianId?: string;

  @ApiPropertyOptional({ example: 'Updated diagnosis' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Updated actions taken' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actionTaken?: string;

  @ApiPropertyOptional({ example: 250.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  reportedAt?: string;
}
