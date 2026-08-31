import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDecimal, IsEnum, IsDateString } from 'class-validator';
import { BudgetCategory } from '@prisma/client';

export class CreateResearchExpenseDto {
  @ApiProperty({ description: 'Research grant ID' })
  @IsUUID()
  @IsNotEmpty()
  researchGrantId!: string;

  @ApiPropertyOptional({ description: 'Research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Budget allocation ID' })
  @IsOptional()
  @IsUUID()
  budgetAllocationId?: string;

  @ApiProperty({ enum: BudgetCategory, description: 'Expense category' })
  @IsEnum(BudgetCategory)
  @IsNotEmpty()
  category!: BudgetCategory;

  @ApiProperty({ description: 'Expense description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Expense amount' })
  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  amount!: string;

  @ApiProperty({ description: 'Expense date' })
  @IsDateString()
  @IsNotEmpty()
  expenseDate!: string;

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
