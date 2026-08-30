import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { RequestPriority, ActivityStatus } from '@prisma/client';

export class CreateProjectActivityDto {
  @ApiProperty({ description: 'Research project ID' })
  @IsUUID()
  @IsNotEmpty()
  researchProjectId!: string;

  @ApiPropertyOptional({ description: 'Assigned project member ID' })
  @IsOptional()
  @IsUUID()
  assignedMemberId?: string;

  @ApiProperty({ description: 'Activity title', example: 'Literature Review' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RequestPriority, description: 'Activity priority' })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ enum: ActivityStatus, description: 'Activity status' })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ description: 'Activity notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
