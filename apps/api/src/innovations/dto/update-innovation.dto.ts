import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { InnovationStage } from '@prisma/client';

export class UpdateInnovationDto {
  @ApiPropertyOptional({ example: 'Updated Smart Energy Monitoring System' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'IoT Technology' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ enum: InnovationStage, example: InnovationStage.PROTOTYPE })
  @IsOptional()
  @IsEnum(InnovationStage)
  developmentStage?: InnovationStage;

  @ApiPropertyOptional({ example: 'uuid-of-research-project' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;
}
