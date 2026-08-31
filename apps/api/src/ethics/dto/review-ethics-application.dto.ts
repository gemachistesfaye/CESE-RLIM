import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EthicsReviewDecision } from '@prisma/client';

export class ReviewEthicsApplicationDto {
  @ApiProperty({ enum: EthicsReviewDecision, description: 'Review decision' })
  @IsEnum(EthicsReviewDecision)
  @IsNotEmpty()
  decision!: EthicsReviewDecision;

  @ApiPropertyOptional({ description: 'Review comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}
