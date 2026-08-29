import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateResearcherDto {
  @ApiProperty({ example: 'Daniel' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Tesfaye' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'daniel@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: '+251911000003' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'ASTU-RES-003' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeOrStudentId!: string;

  @ApiProperty({ example: 'Electrical Engineering' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  department!: string;

  @ApiPropertyOptional({ example: 'Assistant Professor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  academicPosition?: string;

  @ApiPropertyOptional({ example: 'Power Systems, Renewable Energy' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  researchAreas?: string;

  @ApiPropertyOptional({ example: 'Power electronics, Energy storage' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  expertise?: string;

  @ApiPropertyOptional({ example: '0000-0001-2345-6789' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  orcid?: string;

  @ApiPropertyOptional({ example: 'Specialist in power systems research.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}
