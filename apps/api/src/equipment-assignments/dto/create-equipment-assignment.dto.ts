import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

export class CreateEquipmentAssignmentDto {
  @ApiProperty({ example: 'uuid-of-equipment-request' })
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  issuedAt!: string;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  expectedReturnAt!: string;

  @ApiPropertyOptional({ example: 'GOOD' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  conditionAtIssue?: string;

  @ApiPropertyOptional({ example: 'Handle with care during experiments' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
