import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUrl,
  Min,
} from 'class-validator';
import { FundingType, FundingOpportunityStatus } from '@prisma/client';

export class CreateFundingOpportunityDto {
  @ApiProperty({ description: 'Opportunity title', example: 'National Research Grant 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Funding organization name', example: 'National Science Foundation' })
  @IsString()
  @IsNotEmpty()
  organization!: string;

  @ApiPropertyOptional({ description: 'Opportunity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: FundingType, description: 'Type of funding' })
  @IsEnum(FundingType)
  @IsNotEmpty()
  fundingType!: FundingType;

  @ApiPropertyOptional({ description: 'Minimum funding amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum funding amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumAmount?: number;

  @ApiPropertyOptional({ description: 'Application deadline (ISO 8601 date)' })
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @ApiPropertyOptional({ description: 'Eligibility criteria' })
  @IsOptional()
  @IsString()
  eligibilityCriteria?: string;

  @ApiPropertyOptional({ description: 'Application URL' })
  @IsOptional()
  @IsUrl()
  applicationUrl?: string;

  @ApiPropertyOptional({ enum: FundingOpportunityStatus, description: 'Opportunity status', default: FundingOpportunityStatus.OPEN })
  @IsOptional()
  @IsEnum(FundingOpportunityStatus)
  status?: FundingOpportunityStatus;
}
