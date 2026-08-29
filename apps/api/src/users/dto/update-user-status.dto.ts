import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;
}
