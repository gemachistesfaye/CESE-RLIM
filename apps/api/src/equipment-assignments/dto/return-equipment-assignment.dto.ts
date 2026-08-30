import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

export class ReturnEquipmentAssignmentDto {
  @ApiProperty({ example: '2026-09-10T14:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  returnedAt!: string;

  @ApiPropertyOptional({ example: 'GOOD' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  conditionAtReturn?: string;

  @ApiPropertyOptional({ example: 'Equipment returned in good condition' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
