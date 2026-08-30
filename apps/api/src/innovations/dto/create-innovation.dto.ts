import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { InnovationStage, InnovationStatus } from '@prisma/client';

export class CreateInnovationDto {
  @ApiProperty({ example: 'Smart Energy Monitoring System' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'A system for real-time energy monitoring using IoT sensors.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'IoT Technology' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ enum: InnovationStage, example: InnovationStage.IDEA })
  @IsOptional()
  @IsEnum(InnovationStage)
  developmentStage?: InnovationStage;

  @ApiPropertyOptional({ enum: InnovationStatus, example: InnovationStatus.SUBMITTED })
  @IsOptional()
  @IsEnum(InnovationStatus)
  status?: InnovationStatus;

  @ApiPropertyOptional({ example: 'uuid-of-research-project' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiProperty({ example: 'uuid-of-researcher' })
  @IsUUID()
  @IsNotEmpty()
  submittedById!: string;
}
