import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, MaxLength, Min } from 'class-validator';
import { RequestPriority } from '@prisma/client';

export class CreateMaintenanceRecordDto {
  @ApiProperty({ example: 'uuid-of-equipment' })
  @IsString()
  @IsNotEmpty()
  equipmentId!: string;

  @ApiProperty({ example: 'Equipment making unusual noise during operation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  problemDescription!: string;

  @ApiPropertyOptional({ enum: RequestPriority, example: RequestPriority.MEDIUM })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ example: 'uuid-of-technician' })
  @IsOptional()
  @IsString()
  assignedTechnicianId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  reportedAt?: string;

  @ApiPropertyOptional({ example: 'Initial diagnosis notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Actions taken during maintenance' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actionTaken?: string;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'Additional maintenance notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-of-maintenance-researcher' })
  @IsOptional()
  @IsString()
  maintenanceResearcherId?: string;
}
