import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewGrantApplicationDto {
  @ApiProperty({ enum: ReviewDecision, description: 'Review decision' })
  @IsEnum(ReviewDecision)
  @IsNotEmpty()
  decision!: ReviewDecision;

  @ApiPropertyOptional({ description: 'Review comment (required for rejection)' })
  @IsOptional()
  @IsString()
  reviewComment?: string;
}
