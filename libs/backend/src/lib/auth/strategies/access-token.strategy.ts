import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_JWT_CONFIG, AuthJwtConfig } from '../auth.tokens';
import { AccessTokenPayload } from '../interfaces/auth-user.interface';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(AUTH_JWT_CONFIG)
    private readonly config: AuthJwtConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
      issuer: config.issuer,
      audience: config.audience,
    });
  }

  validate(payload: AccessTokenPayload): AccessTokenPayload {
    return payload;
  }
}

