import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FundingOpportunityStatus } from '@prisma/client';

export class UpdateFundingOpportunityStatusDto {
  @ApiProperty({ enum: FundingOpportunityStatus, description: 'New funding opportunity status' })
  @IsEnum(FundingOpportunityStatus)
  @IsNotEmpty()
  status!: FundingOpportunityStatus;
}
