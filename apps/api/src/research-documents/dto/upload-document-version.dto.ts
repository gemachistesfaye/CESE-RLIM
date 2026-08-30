import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UploadDocumentVersionDto {
  @ApiProperty({ description: 'Original file name', example: 'review-draft-v2.pdf' })
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

  @ApiPropertyOptional({ description: 'Description of changes in this version' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeDescription?: string;
}
