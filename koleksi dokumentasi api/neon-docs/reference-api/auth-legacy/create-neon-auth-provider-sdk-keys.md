---
operationId: "createNeonAuthProviderSDKKeys"
method: "POST"
path: "/projects/auth/keys"
tag: "auth-legacy"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Legacy Auth / Create Auth Provider SDK keys

## POST /projects/auth/keys

Generates SDK or API Keys for the auth provider. These might be called different things depending
on the auth provider you're using, but are generally used for setting up the frontend and backend SDKs.


### Request body

- `project_id` (string, required)
  The Neon project ID. Returned as `id` from `GET /projects`.
- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`

### Response (201)

- `auth_provider` (string, optional)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `auth_provider_project_id` (string, optional)
  Project ID assigned by the auth provider for this integration.
- `pub_client_key` (string, optional)
  Publishable SDK key from the auth provider. Populated only for Stack Auth (deprecated); empty for Better Auth.
- `secret_server_key` (string, optional)
  Secret server-side SDK key from the auth provider. Populated only for Stack Auth (deprecated); empty for Better Auth. Treat as a credential.
- `jwks_url` (string, optional)
  URL of the provider's JWKS endpoint used to verify JWTs.
- `schema_name` (string, optional)
  Postgres schema containing the auth integration tables. Defaults to `neon_auth`.
- `table_name` (string, optional)
  Postgres table in the integration schema where synced user records are stored.
- `base_url` (string, optional)
  Base URL of the Neon Auth service for this integration. Set as the NEON_AUTH_BASE_URL environment variable in your application.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/auth/keys" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createNeonAuthProviderSdkKeys({
  client: neon.client
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
