import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsIn, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class GlobalSearchDto {
  @ApiPropertyOptional({ description: 'Search query text', example: 'machine learning' })
  @IsString()
  @MinLength(1)
  q!: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: [
      'ALL', 'RESEARCHER', 'LABORATORY', 'EQUIPMENT', 'PROJECT',
      'INNOVATION', 'PUBLICATION', 'DOCUMENT', 'FUNDING', 'GRANT',
      'ETHICS', 'EVENT', 'MILESTONE', 'REPORT', 'ACTIVITY',
    ],
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'ALL', 'RESEARCHER', 'LABORATORY', 'EQUIPMENT', 'PROJECT',
    'INNOVATION', 'PUBLICATION', 'DOCUMENT', 'FUNDING', 'GRANT',
    'ETHICS', 'EVENT', 'MILESTONE', 'REPORT', 'ACTIVITY',
  ])
  type?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['relevance', 'recent'], default: 'relevance' })
  @IsOptional()
  @IsString()
  @IsIn(['relevance', 'recent'])
  sort?: string;
}

export class GlobalSearchSuggestionDto {
  @ApiPropertyOptional({ description: 'Search query text', example: 'mach' })
  @IsString()
  @MinLength(1)
  q!: string;

  @ApiPropertyOptional({ description: 'Maximum number of suggestions', default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
