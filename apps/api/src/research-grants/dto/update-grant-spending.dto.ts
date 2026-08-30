import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDecimal, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGrantSpendingDto {
  @ApiProperty({ description: 'Spent amount to add', example: 5000.00 })
  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  spentAmount!: string;

  @ApiPropertyOptional({ description: 'Notes about the spending' })
  @IsOptional()
  @IsString()
  notes?: string;
}
