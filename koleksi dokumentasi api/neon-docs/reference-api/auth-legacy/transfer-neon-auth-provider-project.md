---
operationId: "transferNeonAuthProviderProject"
method: "POST"
path: "/projects/auth/transfer_ownership"
tag: "auth-legacy"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Legacy Auth / Transfer Neon-managed auth project to your own account

## POST /projects/auth/transfer_ownership

Transfers ownership of your Neon-managed auth project to your own auth provider account.


### Request body

- `project_id` (string, required)
  The Neon project ID. Returned as `id` from `GET /projects`.
- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`

### Response (200)

- `url` (string, optional)
  URL for completing the process of ownership transfer

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/auth/transfer_ownership" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.transferNeonAuthProviderProject({
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
