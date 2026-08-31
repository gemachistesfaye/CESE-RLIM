import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ParticipationStatus } from '@prisma/client';

export class UpdateParticipationStatusDto {
  @ApiProperty({ enum: ParticipationStatus, description: 'New participation status' })
  @IsEnum(ParticipationStatus)
  @IsNotEmpty()
  status!: ParticipationStatus;
}
