import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean, IsInt, IsDateString, Min, IsEnum } from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateResearchEventDto {
  @ApiProperty({ description: 'Event title', example: 'International AI Conference 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EventType, description: 'Event type' })
  @IsEnum(EventType)
  @IsNotEmpty()
  eventType!: EventType;

  @ApiProperty({ description: 'Start date', example: '2026-09-15T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ description: 'End date', example: '2026-09-17T17:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Registration deadline' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Location/address' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Is virtual event', default: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional({ description: 'Meeting URL for virtual events' })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiPropertyOptional({ description: 'Organizer name' })
  @IsOptional()
  @IsString()
  organizer?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Maximum participants' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'Linked research project ID' })
  @IsOptional()
  @IsUUID()
  researchProjectId?: string;

  @ApiPropertyOptional({ description: 'Linked innovation ID' })
  @IsOptional()
  @IsUUID()
  innovationId?: string;

  @ApiPropertyOptional({ description: 'Linked publication ID' })
  @IsOptional()
  @IsUUID()
  publicationId?: string;

  @ApiPropertyOptional({ description: 'Event objectives' })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional({ description: 'Eligibility criteria' })
  @IsOptional()
  @IsString()
  eligibility?: string;

  @ApiPropertyOptional({ description: 'Requirements' })
  @IsOptional()
  @IsString()
  requirements?: string;
}
