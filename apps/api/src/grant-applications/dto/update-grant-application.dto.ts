import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateGrantApplicationDto {
  @ApiPropertyOptional({ description: 'Funding opportunity ID' })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Application title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Requested funding amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedAmount?: number;

  @ApiPropertyOptional({ description: 'Proposal summary' })
  @IsOptional()
  @IsString()
  proposalSummary?: string;
}
