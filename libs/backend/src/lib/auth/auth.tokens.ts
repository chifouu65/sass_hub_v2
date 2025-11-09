import { InjectionToken } from '@nestjs/common';

export interface AuthJwtConfig {
  secret: string;
  audience?: string;
  issuer?: string;
  clockTolerance?: number;
}

export const AUTH_JWT_CONFIG = 'AUTH_JWT_CONFIG' as InjectionToken<AuthJwtConfig>;

