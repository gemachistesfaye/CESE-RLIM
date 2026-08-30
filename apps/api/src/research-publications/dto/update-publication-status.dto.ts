import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PublicationStatus } from '@prisma/client';

export class UpdatePublicationStatusDto {
  @ApiProperty({ enum: PublicationStatus, description: 'New publication status' })
  @IsEnum(PublicationStatus)
  @IsNotEmpty()
  status!: PublicationStatus;
}
