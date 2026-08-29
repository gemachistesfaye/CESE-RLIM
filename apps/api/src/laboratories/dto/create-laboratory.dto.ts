import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { LabStatus } from '@prisma/client';

export class CreateLaboratoryDto {
  @ApiProperty({ example: 'Power Systems Research Lab' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'PSRL-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Block B, Room 204, Engineering Faculty' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  location!: string;

  @ApiPropertyOptional({ example: 'Dedicated to power systems and renewable energy research.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'uuid-of-responsible-person' })
  @IsOptional()
  @IsString()
  responsiblePersonId?: string;
}
