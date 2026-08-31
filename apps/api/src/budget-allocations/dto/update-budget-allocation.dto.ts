import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDecimal, IsEnum } from 'class-validator';
import { BudgetCategory } from '@prisma/client';

export class UpdateBudgetAllocationDto {
  @ApiPropertyOptional({ enum: BudgetCategory, description: 'Budget category' })
  @IsOptional()
  @IsEnum(BudgetCategory)
  category?: BudgetCategory;

  @ApiPropertyOptional({ description: 'Allocated amount' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  allocatedAmount?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
