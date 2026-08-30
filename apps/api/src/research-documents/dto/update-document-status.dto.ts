import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: DocumentStatus, description: 'New document status' })
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status!: DocumentStatus;
}
