import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateProjectActivityProgressDto {
  @ApiProperty({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  progress!: number;
}
