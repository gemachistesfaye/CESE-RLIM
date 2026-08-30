import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsUrl,
  IsInt,
  Min,
} from 'class-validator';
import { PublicationType } from '@prisma/client';

export class UpdateResearchPublicationDto {
  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Publication title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Publication abstract' })
  @IsOptional()
  @IsString()
  abstract?: string;

  @ApiPropertyOptional({ enum: PublicationType, description: 'Publication type' })
  @IsOptional()
  @IsEnum(PublicationType)
  publicationType?: PublicationType;

  @ApiPropertyOptional({ description: 'Journal name' })
  @IsOptional()
  @IsString()
  journalName?: string;

  @ApiPropertyOptional({ description: 'Conference name' })
  @IsOptional()
  @IsString()
  conferenceName?: string;

  @ApiPropertyOptional({ description: 'Publisher name' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ description: 'DOI (Digital Object Identifier)' })
  @IsOptional()
  @IsString()
  doi?: string;

  @ApiPropertyOptional({ description: 'ISBN number' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: 'Publication date' })
  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @ApiPropertyOptional({ description: 'URL to the publication' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Citation count', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  citationCount?: number;
}
