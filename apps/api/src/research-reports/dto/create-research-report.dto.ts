import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, Min, Max, IsDateString, IsEnum } from 'class-validator';
import { ResearchReportType } from '@prisma/client';

export class CreateResearchReportDto {
  @ApiProperty({ description: 'Report title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ enum: ResearchReportType, description: 'Report type' })
  @IsEnum(ResearchReportType)
  @IsNotEmpty()
  reportType!: ResearchReportType;

  @ApiProperty({ description: 'Research project ID' })
  @IsUUID()
  @IsNotEmpty()
  researchProjectId!: string;

  @ApiPropertyOptional({ description: 'Reporting period start date' })
  @IsOptional()
  @IsDateString()
  reportingPeriodStart?: string;

  @ApiPropertyOptional({ description: 'Reporting period end date' })
  @IsOptional()
  @IsDateString()
  reportingPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'Report content' })
  @IsOptional()
  @IsString()
  reportContent?: string;

  @ApiPropertyOptional({ description: 'File URL' })
  @IsOptional()
  @IsString()
  fileUrl?: string;


  @ApiPropertyOptional({ description: 'Next period plan' })
  @IsOptional()
  @IsString()
  nextPeriodPlan?: string;
}
