import { ISODateString, UUID } from '@sass-hub-v2/shared-types';

export interface AuthLoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateString;
  user: AuthenticatedUser;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  expiresAt: ISODateString;
}

export interface AuthValidateTokenRequest {
  accessToken: string;
}

export interface AuthenticatedUser {
  id: UUID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizations: Array<{
    id: UUID;
    name: string;
    slug: string;
    role: string | null;
  }>;
  roles: string[];
  permissions: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AuthValidateTokenResponse {
  valid: boolean;
  expiresAt: ISODateString | null;
}

