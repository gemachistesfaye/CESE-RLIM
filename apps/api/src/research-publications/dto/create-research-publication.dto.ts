import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsUrl,
  IsInt,
  Min,
} from 'class-validator';
import { PublicationType, PublicationStatus } from '@prisma/client';

export class CreateResearchPublicationDto {
  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiProperty({ description: 'Publication title', example: 'Deep Learning for Signal Processing' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Publication abstract' })
  @IsOptional()
  @IsString()
  abstract?: string;

  @ApiProperty({ enum: PublicationType, description: 'Publication type' })
  @IsEnum(PublicationType)
  @IsNotEmpty()
  publicationType!: PublicationType;

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

  @ApiPropertyOptional({ enum: PublicationStatus, description: 'Publication status', default: PublicationStatus.DRAFT })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;

  @ApiPropertyOptional({ description: 'Citation count', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  citationCount?: number;
}
