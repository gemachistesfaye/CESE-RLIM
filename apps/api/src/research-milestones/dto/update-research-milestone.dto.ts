import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsUUID } from 'class-validator';

export class UpdateResearchMilestoneDto {
  @ApiPropertyOptional({ description: 'Milestone title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Milestone order' })
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

  @ApiPropertyOptional({ description: 'Actual completion date' })
  @IsOptional()
  @IsDateString()
  actualCompletionDate?: string;

  @ApiPropertyOptional({ description: 'Responsible project member ID' })
  @IsOptional()
  @IsUUID()
  responsibleMemberId?: string;


  @ApiPropertyOptional({ description: 'Deliverable link' })
  @IsOptional()
  @IsString()
  deliverableLink?: string;
}
