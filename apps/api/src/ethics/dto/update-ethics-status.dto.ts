import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EthicsApplicationStatus } from '@prisma/client';

export class UpdateEthicsStatusDto {
  @ApiProperty({ enum: EthicsApplicationStatus, description: 'New status' })
  @IsEnum(EthicsApplicationStatus)
  @IsNotEmpty()
  status!: EthicsApplicationStatus;
}
