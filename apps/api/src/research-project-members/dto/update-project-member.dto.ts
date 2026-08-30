import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ProjectMemberRole } from '@prisma/client';

export class UpdateProjectMemberDto {
  @ApiPropertyOptional({ enum: ProjectMemberRole, description: 'Project role', example: ProjectMemberRole.CO_INVESTIGATOR })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;

  @ApiPropertyOptional({ description: 'Whether the member is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Date when the member left the project', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  leftAt?: string;
}
