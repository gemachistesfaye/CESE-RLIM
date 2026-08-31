import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetUserPasswordDto {
  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @IsString()
  status!: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export class UserQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}
