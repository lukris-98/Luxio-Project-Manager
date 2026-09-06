---
operationId: "listBranchNeonAuthOauthProviders"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/auth/oauth_providers"
tag: "auth"
stability: "beta"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Authentication / List OAuth providers for the branch

## GET /projects/{project_id}/branches/{branch_id}/auth/oauth_providers

Lists the OAuth providers configured for the specified branch's Neon Auth integration.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Response (200)

```json
{
  "providers": [
    {
      "id": "google",
      "type": "shared"
    },
    {
      "id": "vercel",
      "type": "standard",
      "client_id": "example-client-id",
      "client_secret": "<client_secret>"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/oauth_providers" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listBranchNeonAuthOauthProviders({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon neon-auth oauth-provider list
```

### MCP

Tool: `get_neon_auth_config`

Read full Neon Auth configuration for a branch. Do not use when you need to update config (use `configure_neon_auth` instead). Requires Neon Auth to be provisioned first (use `provision_neon_auth`). Returns Neon Auth (Better Auth) for a branch as one JSON object: integration metadata (base_url, jwks_url, db_name, auth_provider, branch_id, created_at, owned_by, transfer_status, auth_provider_project_id), branch_name from the Neon branch API, project_id and resolved branch_id, plus the same configurable fields as configure_neon_auth (trusted_origins, allow_localhost, auth_methods.email_password with enabled, allow_sign_up, verify_email_on_sign_up, verify_email_on_sign_in, email_verification_method, require_email_verification, auto_sign_in_after_verification, oauth_providers (id, type, client_id, client_secret), email_provider (discriminated by type)). Top-level base_url, jwks_url, and db_name duplicate integration for quick copy. Optional _errors records partial fetch failures for configurable slices. Secrets — OAuth client_secret and the SMTP password — are NEVER returned. When the upstream config indicates a secret is set, this endpoint surfaces it as the literal sentinel "***redacted***"; when no secret is set the field is null. Use the matching configure_neon_auth operations to write or rotate these values.

- `projectId` (string, required)
  Neon project ID
- `branchId` (string, optional)
  Branch ID. If omitted, the project default branch is used (same as provision_neon_auth).

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
