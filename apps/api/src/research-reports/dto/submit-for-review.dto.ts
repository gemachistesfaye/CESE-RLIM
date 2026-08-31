import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SubmitForReviewDto {
  @ApiProperty({ description: 'Reviewer user ID' })
  @IsUUID()
  @IsNotEmpty()
  reviewerId!: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
