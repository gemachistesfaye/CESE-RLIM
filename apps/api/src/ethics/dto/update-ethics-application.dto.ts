import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateEthicsApplicationDto {
  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Application title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Research summary' })
  @IsOptional()
  @IsString()
  researchSummary?: string;

  @ApiPropertyOptional({ description: 'Research methodology' })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({ description: 'Participant details' })
  @IsOptional()
  @IsString()
  participantDetails?: string;

  @ApiPropertyOptional({ description: 'Risk assessment' })
  @IsOptional()
  @IsString()
  riskAssessment?: string;

  @ApiPropertyOptional({ description: 'Benefit statement' })
  @IsOptional()
  @IsString()
  benefitStatement?: string;

  @ApiPropertyOptional({ description: 'Data protection plan' })
  @IsOptional()
  @IsString()
  dataProtectionPlan?: string;

  @ApiPropertyOptional({ description: 'Consent process description' })
  @IsOptional()
  @IsString()
  consentProcess?: string;
}
