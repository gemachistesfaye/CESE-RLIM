import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateMilestoneProgressDto {
  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  progress!: number;
}
