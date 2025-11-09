import {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRefreshRequest,
  AuthRefreshResponse,
  AuthValidateTokenRequest,
  AuthValidateTokenResponse,
} from '@sass-hub-v2/contracts';
import { HttpClient } from './http-client';

export interface AuthClientConfig {
  basePath?: string;
}

export class AuthServiceClient {
  private readonly basePath: string;

  constructor(private readonly http: HttpClient, config: AuthClientConfig = {}) {
    this.basePath = config.basePath ?? '/api/auth';
  }

  login(payload: AuthLoginRequest): Promise<AuthLoginResponse> {
    return this.http.request<AuthLoginResponse>({
      method: 'POST',
      path: `${this.basePath}/login`,
      body: payload,
    });
  }

  refresh(payload: AuthRefreshRequest): Promise<AuthRefreshResponse> {
    return this.http.request<AuthRefreshResponse>({
      method: 'POST',
      path: `${this.basePath}/refresh`,
      body: payload,
    });
  }

  validate(payload: AuthValidateTokenRequest): Promise<AuthValidateTokenResponse> {
    return this.http.request<AuthValidateTokenResponse>({
      method: 'POST',
      path: `${this.basePath}/validate`,
      body: payload,
    });
  }
}

