import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ResearchReportStatus } from '@prisma/client';

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ResearchReportStatus, description: 'New report status' })
  @IsEnum(ResearchReportStatus)
  @IsNotEmpty()
  status!: ResearchReportStatus;

  @ApiPropertyOptional({ description: 'Review comment' })
  @IsOptional()
  @IsString()
  reviewComment?: string;
}
