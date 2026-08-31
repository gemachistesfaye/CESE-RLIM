import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExpenseStatus } from '@prisma/client';

export class ReviewResearchExpenseDto {
  @ApiProperty({ enum: ExpenseStatus, description: 'New status' })
  @IsEnum(ExpenseStatus)
  @IsNotEmpty()
  status!: ExpenseStatus;

  @ApiPropertyOptional({ description: 'Rejection reason (required if rejecting)' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
