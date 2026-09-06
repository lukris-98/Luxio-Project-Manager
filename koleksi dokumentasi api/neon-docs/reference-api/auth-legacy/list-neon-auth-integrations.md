---
operationId: "listNeonAuthIntegrations"
method: "GET"
path: "/projects/{project_id}/auth/integrations"
tag: "auth-legacy"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Legacy Auth / List active integrations with auth providers

## GET /projects/{project_id}/auth/integrations

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth` instead. Removal scheduled for March 1, 2026.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

- `data` (array, optional)
  Neon Auth integrations configured for the project.
  - `auth_provider` (string, required)
    Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
    Possible values: `mock`, `stack`, `better_auth`
  - `auth_provider_project_id` (string, required)
    Project identifier assigned by the auth provider for this integration.
  - `branch_id` (string, required)
    The Neon branch ID. Returned as `id` from `GET /projects/{project_id}/branches`.
  - `db_name` (string, required)
    Name of the database used by the Neon Auth integration.
  - `created_at` (string, required, format: date-time)
    Timestamp when the Neon Auth integration was created, in RFC 3339 format (UTC).
  - `owned_by` (string, required)
    Owner of the auth provider project. `neon` means the project is created and managed by Neon on your behalf. `user` means the project was created in your own auth provider account and is self-managed.
    Possible values: `user`, `neon`
  - `transfer_status` (string, optional)
    Ownership transfer state for the auth provider project. `initiated` means a transfer was requested but not completed. `finished` means it completed successfully.
    Possible values: `initiated`, `finished`
  - `jwks_url` (string, required)
    URL of the provider's JWKS endpoint used to verify JWTs.
  - `base_url` (string, optional)
    Base URL of the Neon Auth service endpoint for this integration. Injected into the project environment as `NEON_AUTH_BASE_URL`.
  - `name` (string, optional)
    Application name shown in auth emails and communications. Defaults to the project name.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/integrations" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listNeonAuthIntegrations({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

### Console

Console path: Projects → Auth → Configuration

### Errors

**default**
General Error.

The request may or may not be safe to retry, depending on the HTTP method, response status code,
and whether a response was received.

- If no response is returned from the API, a network error or timeout likely occurred.
- In some cases, the request may have reached the server and been successfully processed, but the response failed to reach the client. As a result, retrying non-idempotent requests can lead to unintended results.

The following HTTP methods are considered non-idempotent: `POST`, `PATCH`, `DELETE`, and `PUT`. Retrying these methods is generally **not safe**.
The following methods are considered idempotent: `GET`, `HEAD`, and `OPTIONS`. Retrying these methods is **safe** in the event of a network error or timeout.

Any request that returns a `503 Service Unavailable` response is always safe to retry.

Any request that returns a `423 Locked` response is safe to retry. `423 Locked` indicates that the resource is temporarily locked, for example, due to another operation in progress.

- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message
