export interface AuthenticatedUser {
  sub: string;
  email?: string;
  organizationId?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

export interface AccessTokenPayload extends AuthenticatedUser {
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
}

