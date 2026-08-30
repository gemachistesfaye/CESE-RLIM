import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateResearchProjectDto {
  @ApiProperty({ example: 'PRJ-2026-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  projectCode!: string;

  @ApiProperty({ example: 'AI-Based Laboratory Monitoring System' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Development of an AI-based system for real-time laboratory monitoring.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProjectStatus)
  projectStatus?: ProjectStatus;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
