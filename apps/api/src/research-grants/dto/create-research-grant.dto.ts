import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsDecimal,
} from 'class-validator';
import { GrantStatus } from '@prisma/client';

export class CreateResearchGrantDto {
  @ApiProperty({ description: 'Grant number', example: 'GRANT-2026-001' })
  @IsString()
  @IsNotEmpty()
  grantNumber!: string;

  @ApiProperty({ description: 'Grant application ID' })
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string;

  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Principal investigator researcher ID' })
  @IsOptional()
  @IsUUID()
  principalInvestigatorId?: string;

  @ApiProperty({ description: 'Awarded amount', example: 50000.00 })
  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  awardedAmount!: string;

  @ApiProperty({ description: 'Grant start date' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ description: 'Grant end date' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({ enum: GrantStatus, description: 'Grant status' })
  @IsOptional()
  @IsEnum(GrantStatus)
  status?: GrantStatus;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
