import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewEquipmentRequestDto {
  @ApiProperty({ enum: ReviewAction, example: ReviewAction.APPROVE })
  @IsEnum(ReviewAction)
  @IsNotEmpty()
  action!: ReviewAction;

  @ApiPropertyOptional({ example: 'Request approved for research purposes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewComment?: string;

  @ApiPropertyOptional({ example: 'Equipment is not available for the requested dates' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
