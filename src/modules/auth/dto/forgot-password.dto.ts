import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'student.001@placementtracker.edu',
    description: 'Registered email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
