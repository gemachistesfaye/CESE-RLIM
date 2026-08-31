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

  @ApiPropertyOptional({ description: 'Executive summary' })
  @IsOptional()
  @IsString()
  executiveSummary?: string;

  @ApiPropertyOptional({ description: 'Objectives' })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional({ description: 'Methodology' })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({ description: 'Achievements' })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({ description: 'Challenges' })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiPropertyOptional({ description: 'Findings' })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({ description: 'Recommendations' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ description: 'Conclusion' })
  @IsOptional()
  @IsString()
  conclusion?: string;

  @ApiPropertyOptional({ description: 'Progress percentage' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @ApiPropertyOptional({ description: 'Next period plan' })
  @IsOptional()
  @IsString()
  nextPeriodPlan?: string;
}
