import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateGrantApplicationDto {
  @ApiProperty({ description: 'Funding opportunity ID' })
  @IsUUID()
  @IsNotEmpty()
  opportunityId!: string;

  @ApiPropertyOptional({ description: 'Research project ID (optional)' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiProperty({ description: 'Application title', example: 'AI for Drug Discovery' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Requested funding amount', example: 50000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  requestedAmount!: number;

  @ApiProperty({ description: 'Proposal summary' })
  @IsString()
  @IsNotEmpty()
  proposalSummary!: string;
}
