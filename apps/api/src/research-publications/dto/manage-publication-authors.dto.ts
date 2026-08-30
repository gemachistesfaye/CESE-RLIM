import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PublicationAuthorEntryDto {
  @ApiProperty({ description: 'Researcher ID' })
  @IsUUID()
  @IsNotEmpty()
  researcherId!: string;

  @ApiProperty({ description: 'Author order (1-based)', minimum: 1 })
  @IsInt()
  @Min(1)
  authorOrder!: number;

  @ApiProperty({ description: 'Is corresponding author', default: false })
  @IsBoolean()
  isCorrespondingAuthor!: boolean;
}

export class ManagePublicationAuthorsDto {
  @ApiProperty({ description: 'List of authors (replaces all existing authors)', type: [PublicationAuthorEntryDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PublicationAuthorEntryDto)
  authors!: PublicationAuthorEntryDto[];
}
