import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ProjectMemberRole } from '@prisma/client';

export class CreateProjectMemberDto {
  @ApiProperty({ description: 'Research project ID', example: 'uuid-of-project' })
  @IsString()
  @IsNotEmpty()
  researchProjectId!: string;

  @ApiProperty({ description: 'Researcher ID', example: 'uuid-of-researcher' })
  @IsString()
  @IsNotEmpty()
  researcherId!: string;

  @ApiPropertyOptional({ enum: ProjectMemberRole, description: 'Project role', example: ProjectMemberRole.RESEARCHER })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;

  @ApiPropertyOptional({ description: 'Whether the member is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
