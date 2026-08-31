import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateEthicsApplicationDto {
  @ApiProperty({ description: 'Research project ID' })
  @IsUUID()
  @IsNotEmpty()
  researchProjectId!: string;

  @ApiProperty({ description: 'Application title', example: 'Clinical Trial Phase II' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Research summary' })
  @IsString()
  @IsNotEmpty()
  researchSummary!: string;

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
