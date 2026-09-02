import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DocumentType, DocumentStatus } from '@prisma/client';

export class UpdateResearchDocumentDto {
  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Document title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentType, description: 'Document type' })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiPropertyOptional({ description: 'Original file name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ description: 'File path or URL' })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({ description: 'MIME type of the file' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  @IsOptional()
  @IsInt()
  version?: number;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Document status' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
