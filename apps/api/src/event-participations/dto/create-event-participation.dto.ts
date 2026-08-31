import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateEventParticipationDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  @IsNotEmpty()
  eventId!: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
