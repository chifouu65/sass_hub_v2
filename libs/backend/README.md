# Backend Shared Library

This library centralises backend building blocks that are shared across services:

- `TenantDatabaseService` and `TenantDbModule` for multi-tenant MySQL management.
- `BackendAuthModule` for common authentication utilities (Passport guard, JWT strategy, decorators).

## Usage

Import only what you need:

```ts
import { TenantDbModule } from '@sass-hub-v2/tenant-db';
import { BackendAuthModule, CurrentUser } from '@sass-hub-v2/backend/auth';
```

### Unit tests

Run `nx test tenant-db` to execute the unit tests via [Jest](https://jestjs.io).
