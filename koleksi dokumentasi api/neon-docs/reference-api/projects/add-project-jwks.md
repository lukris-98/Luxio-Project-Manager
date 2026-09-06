---
operationId: "addProjectJWKS"
method: "POST"
path: "/projects/{project_id}/jwks"
tag: "projects"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Projects / Add JWKS URL

## POST /projects/{project_id}/jwks

Adds a JWKS URL to the specified project for verifying JWTs used as the authentication mechanism.

The URL must be a valid HTTPS URL that returns a JSON Web Key Set.

The `provider_name` field allows you to specify which authentication provider you're using (e.g., Clerk, Auth0, AWS Cognito).

The `branch_id` scopes the JWKS URL to specific branches; if not specified, it applies to all branches.

The `role_names` scopes the URL to specific roles; if not specified, default roles are used (`authenticator`, `authenticated`, `anonymous`).

The `jwt_audience` specifies which `aud` values are accepted in JWTs.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `jwks_url` (string, required)
  URL of the provider's JWKS endpoint used to verify JWTs.
- `provider_name` (string, required)
  The name of the authentication provider (e.g., Clerk, Stytch, Auth0)
- `branch_id` (string, optional)
  The Neon branch ID. Returned as `id` from `GET /projects/{project_id}/branches`.
- `jwt_audience` (string, optional)
  Expected `aud` claim in incoming JWTs. When set, tokens with a different audience are rejected; tokens with no audience are still accepted. Omit to skip audience validation.
- `role_names` (array, optional, deprecated)
  Deprecated. The roles the JWKS should be mapped to. By default, the JWKS is mapped to the `authenticator`, `authenticated`, and `anonymous` roles.
- `skip_role_creation` (boolean, optional)
  Deprecated. Only used with Neon RLS. If true, role creation is skipped.
  Default: `false`

### Response (201)

```json
{
  "jwks": {
    "id": "00000000-0000-0000-0000-000000000000",
    "project_id": "aged-wildflower-123456",
    "branch_id": "br-young-forest-a5b6c7d8",
    "jwks_url": "https://www.googleapis.com/oauth2/v3/certs",
    "provider_name": "Google",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "jwt_audience": "authenticated",
    "role_names": []
  },
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "apply_config",
      "status": "running",
      "failures_count": 0,
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-12345678",
      "action": "apply_config",
      "status": "scheduling",
      "failures_count": 0,
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/jwks" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.addProjectJwks({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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
