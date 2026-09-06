---
operationId: "deleteNeonAuthIntegration"
method: "DELETE"
path: "/projects/{project_id}/auth/integration/{auth_provider}"
tag: "auth-legacy"
interfaces: ["api", "sdk"]
---
> API Reference / Legacy Auth / Delete integration with auth provider

## DELETE /projects/{project_id}/auth/integration/{auth_provider}

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth` instead. Removal scheduled for March 1, 2026.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `auth_provider` (string, path, required)
  The authentication provider name

### Request body

- `delete_data` (boolean, optional)
  If true, deletes the `neon_auth` schema from the database
  Default: `false`

### Response (200)

Delete the integration with the authentication provider

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/integration/$AUTH_PROVIDER" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteNeonAuthIntegration({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    auth_provider: process.env.AUTH_PROVIDER
  }
});
```

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
