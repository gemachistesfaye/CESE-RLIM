import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateResearchDocumentDto {
  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiProperty({ description: 'Document title', example: 'Literature Review Draft' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DocumentType, description: 'Document type' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @ApiProperty({ description: 'Original file name', example: 'review-draft.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ description: 'File path or URL' })
  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 1048576 })
  @IsInt()
  @Min(1)
  fileSize!: number;

  @ApiPropertyOptional({ description: 'Storage key (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  storageKey?: string;
}
