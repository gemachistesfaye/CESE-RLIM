import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDecimal, IsEnum, IsDateString } from 'class-validator';
import { BudgetCategory } from '@prisma/client';

export class UpdateResearchExpenseDto {
  @ApiPropertyOptional({ description: 'Budget allocation ID' })
  @IsOptional()
  @IsUUID()
  budgetAllocationId?: string;

  @ApiPropertyOptional({ enum: BudgetCategory, description: 'Expense category' })
  @IsOptional()
  @IsEnum(BudgetCategory)
  category?: BudgetCategory;

  @ApiPropertyOptional({ description: 'Expense description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Expense amount' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  amount?: string;

  @ApiPropertyOptional({ description: 'Expense date' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Receipt document ID' })
  @IsOptional()
  @IsUUID()
  receiptDocumentId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
