import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateResearchProjectStatusDto {
  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  @IsNotEmpty()
  status!: ProjectStatus;
}
