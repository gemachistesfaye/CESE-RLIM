import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.COORDINATOR })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
