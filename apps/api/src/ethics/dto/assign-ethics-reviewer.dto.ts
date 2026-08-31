import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignEthicsReviewerDto {
  @ApiProperty({ description: 'Researcher ID to assign as reviewer' })
  @IsUUID()
  @IsNotEmpty()
  reviewerId!: string;
}
