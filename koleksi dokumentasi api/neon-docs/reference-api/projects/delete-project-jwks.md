---
operationId: "deleteProjectJWKS"
method: "DELETE"
path: "/projects/{project_id}/jwks/{jwks_id}"
tag: "projects"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Projects / Delete JWKS URL

## DELETE /projects/{project_id}/jwks/{jwks_id}

Removes the specified JWKS URL from the project.
JWTs signed by keys from the removed URL can no longer authenticate to the project's endpoints.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `jwks_id` (string, path, required)
  The JWKS ID

### Response (200)

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "project_id": "misty-meadow-000012",
  "jwks_url": "https://www.googleapis.com/oauth2/v3/certs",
  "provider_name": "Google",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "jwt_audience": "authenticated",
  "role_names": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/jwks/$JWKS_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectJwks({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    jwks_id: process.env.JWKS_ID
  }
});
```

### Console

Console path: Projects → Settings → Authentication providers

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
