import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/config.service';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  roles: Array<{ role: string; scopeType: string; scopeId: string }>;
  enrollment?: {
    id: string;
    academicPeriodId: string;
    branchId: string;
    sectionId: string;
    groupId?: string;
    batchId: string;
  };
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
      issuer: config.jwt.issuer || undefined,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      enrollment: payload.enrollment || null,
      isStudent: !!payload.enrollment,
    };
  }
}
