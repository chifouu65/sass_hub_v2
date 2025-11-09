import { AuthClientConfig, AuthServiceClient } from './auth-client';
import { FetchHttpClient, HttpClientConfig, HttpError } from './http-client';
import { TenantClientConfig, TenantServiceClient } from './tenant-client';

export interface SaasHubSdkConfig extends HttpClientConfig {
  auth?: AuthClientConfig;
  tenant?: TenantClientConfig;
}

export class SaasHubSdk {
  readonly auth: AuthServiceClient;
  readonly tenants: TenantServiceClient;
  readonly http: FetchHttpClient;

  constructor(config: SaasHubSdkConfig) {
    this.http = new FetchHttpClient(config);
    this.auth = new AuthServiceClient(this.http, config.auth);
    this.tenants = new TenantServiceClient(this.http, config.tenant);
  }
}

export function createSaasHubSdk(config: SaasHubSdkConfig): SaasHubSdk {
  return new SaasHubSdk(config);
}

export { AuthServiceClient, TenantServiceClient, HttpError };
