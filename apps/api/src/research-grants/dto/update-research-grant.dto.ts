import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsDecimal,
} from 'class-validator';

export class UpdateResearchGrantDto {
  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Principal investigator researcher ID' })
  @IsOptional()
  @IsUUID()
  principalInvestigatorId?: string;

  @ApiPropertyOptional({ description: 'Awarded amount' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  awardedAmount?: string;

  @ApiPropertyOptional({ description: 'Grant start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Grant end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
