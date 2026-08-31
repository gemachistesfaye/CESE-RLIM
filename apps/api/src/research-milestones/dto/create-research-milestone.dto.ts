import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';

export class CreateResearchMilestoneDto {
  @ApiProperty({ description: 'Research project ID' })
  @IsUUID()
  @IsNotEmpty()
  researchProjectId!: string;

  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Milestone order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  milestoneOrder?: number;

  @ApiPropertyOptional({ description: 'Planned start date' })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @ApiPropertyOptional({ description: 'Planned due date' })
  @IsOptional()
  @IsDateString()
  plannedDueDate?: string;

  @ApiPropertyOptional({ description: 'Responsible project member ID' })
  @IsOptional()
  @IsUUID()
  responsibleMemberId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
