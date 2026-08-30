import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { GrantStatus } from '@prisma/client';

export class UpdateGrantStatusDto {
  @ApiProperty({ enum: GrantStatus, description: 'New grant status' })
  @IsEnum(GrantStatus)
  @IsNotEmpty()
  status!: GrantStatus;
}
