import { ApiProperty } from '@nestjs/swagger';

export class UserInfo {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@placementtracker.edu' })
  email: string;

  @ApiProperty({ example: 'System Admin' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: [{ role: 'admin', scopeType: 'global', scopeId: null }],
    description: 'Active role assignments',
  })
  roles: Array<{
    role: string;
    scopeType: string;
    scopeId: string | null;
  }>;

  @ApiProperty({ example: false })
  mustChangePassword: boolean;

  @ApiProperty({
    example: {
      id: 'uuid',
      academicPeriodId: 'uuid',
      branchId: 'uuid',
      sectionId: 'uuid',
      groupId: 'uuid',
      batchId: 'uuid',
      rollNumber: '23BH1A7243',
    },
    description: 'Active enrollment (null for non-students)',
    nullable: true,
  })
  enrollment: {
    id: string;
    academicPeriodId: string;
    branchId: string;
    sectionId: string;
    groupId?: string;
    batchId: string;
    rollNumber?: string;
  } | null;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'JWT access token (short-lived)',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user information',
  })
  user: UserInfo;
}

export class TokenRefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'New JWT access token',
  })
  accessToken: string;
}
