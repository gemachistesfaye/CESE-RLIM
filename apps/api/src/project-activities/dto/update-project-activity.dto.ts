import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { RequestPriority } from '@prisma/client';

export class UpdateProjectActivityDto {
  @ApiPropertyOptional({ description: 'Assigned project member ID' })
  @IsOptional()
  @IsUUID()
  assignedMemberId?: string;

  @ApiPropertyOptional({ description: 'Activity title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RequestPriority, description: 'Activity priority' })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Activity notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
