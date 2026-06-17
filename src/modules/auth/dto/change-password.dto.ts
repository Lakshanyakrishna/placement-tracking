import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'ChangeMe@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePass@456' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
