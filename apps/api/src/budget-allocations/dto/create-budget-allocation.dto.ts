import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDecimal, IsEnum } from 'class-validator';
import { BudgetCategory } from '@prisma/client';

export class CreateBudgetAllocationDto {
  @ApiProperty({ description: 'Research grant ID' })
  @IsUUID()
  @IsNotEmpty()
  researchGrantId!: string;

  @ApiProperty({ enum: BudgetCategory, description: 'Budget category' })
  @IsEnum(BudgetCategory)
  @IsNotEmpty()
  category!: BudgetCategory;

  @ApiProperty({ description: 'Allocated amount' })
  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  allocatedAmount!: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
