import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsEnum } from 'class-validator';
import { ResearchReportType } from '@prisma/client';

export class UpdateResearchReportDto {
  @ApiPropertyOptional({ description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ResearchReportType, description: 'Report type' })
  @IsOptional()
  @IsEnum(ResearchReportType)
  reportType?: ResearchReportType;

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
