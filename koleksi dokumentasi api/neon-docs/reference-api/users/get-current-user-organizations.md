---
operationId: "getCurrentUserOrganizations"
method: "GET"
path: "/users/me/organizations"
tag: "users"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Users / List organizations for the current user

## GET /users/me/organizations

Retrieves the organizations that the currently authenticated user belongs to.

When called with an organization- or project-scoped API key (which is not
tied to a user), this returns the single organization that owns the key.


### Response (200)

```json
{
  "organizations": [
    {
      "id": "org-mossy-fern-111111",
      "name": "My Other Org",
      "handle": "my-other-org-org-mossy-fern-111111",
      "plan": "free",
      "created_at": "2025-01-15T10:30:00Z",
      "managed_by": "vercel",
      "updated_at": "2025-01-15T11:00:00Z",
      "require_mfa": false
    },
    {
      "id": "org-coral-tide-222222",
      "name": "My Backup Org",
      "handle": "my-backup-org-org-coral-tide-222222",
      "plan": "free",
      "created_at": "2025-01-15T11:30:00Z",
      "managed_by": "console",
      "updated_at": "2025-01-15T11:30:00Z",
      "require_mfa": false
    },
    {
      "id": "org-pebble-stone-333333",
      "name": "My Archived Org",
      "handle": "my-archived-org-org-pebble-stone-333333",
      "plan": "free",
      "created_at": "2025-01-15T12:00:00Z",
      "managed_by": "console",
      "updated_at": "2025-01-15T12:30:00Z",
      "require_mfa": false
    },
    {
      "id": "org-spring-garden-12345",
      "name": "My Org",
      "handle": "my-org-org-spring-garden-12345",
      "plan": "scale",
      "created_at": "2025-01-15T13:00:00Z",
      "managed_by": "console",
      "updated_at": "2025-01-15T13:30:00Z",
      "require_mfa": false
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/users/me/organizations" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getCurrentUserOrganizations({
  client: neon.client
});
```

```bash
# neonctl
neon orgs list
```

### MCP

Tool: `list_organizations`

List all organizations the current user belongs to. Supports optional `search` parameter to filter by name or ID.

- `search` (string, optional)
  Search organizations by name or ID. You can specify partial name or ID values to filter results.

### Console

Console path: Account settings → Profile

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
