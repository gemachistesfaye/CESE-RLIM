import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsUrl,
  Min,
} from 'class-validator';
import { FundingType } from '@prisma/client';

export class UpdateFundingOpportunityDto {
  @ApiPropertyOptional({ description: 'Opportunity title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Funding organization name' })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({ description: 'Opportunity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FundingType, description: 'Type of funding' })
  @IsOptional()
  @IsEnum(FundingType)
  fundingType?: FundingType;

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
}
