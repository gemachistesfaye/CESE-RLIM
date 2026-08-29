import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateResearcherDto {
  @ApiPropertyOptional({ example: 'ASTU-RES-003' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeOrStudentId?: string;

  @ApiPropertyOptional({ example: 'Electrical Engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  department?: string;

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
