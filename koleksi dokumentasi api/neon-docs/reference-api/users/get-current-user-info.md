---
operationId: "getCurrentUserInfo"
method: "GET"
path: "/users/me"
tag: "users"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Users / Retrieve current user details

## GET /users/me

Retrieves information about the currently authenticated Neon user,
including account identifiers, plan details, and linked auth accounts.


### Response (200)

```json
{
  "active_seconds_limit": 0,
  "auth_accounts": [
    {
      "email": "jane.doe@example.com",
      "image": "https://example.com/avatar.png",
      "login": "jane-doe",
      "name": "Jane",
      "provider": "google"
    },
    {
      "email": "jane.doe@example.com",
      "image": "https://example.com/avatar.png",
      "login": "jane-doe",
      "name": "Jane",
      "provider": "keycloak"
    },
    {
      "email": "jane.doe@example.com",
      "image": "https://example.com/avatar.png",
      "login": "jane-doe",
      "name": "Jane",
      "provider": "vercelmp"
    }
  ],
  "email": "jane.doe@example.com",
  "id": "00000000-0000-0000-0000-000000000000",
  "image": "https://example.com/avatar.png",
  "login": "jane-doe",
  "name": "Jane",
  "last_name": "Doe",
  "projects_limit": 0,
  "branches_limit": 0,
  "max_autoscaling_limit": 0,
  "plan": "free"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/users/me" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getCurrentUserInfo({
  client: neon.client
});
```

```bash
# neonctl
neon me
```

### MCP

Tool: `list_projects`

List Neon projects in your account. Do not use for projects shared with you (use `list_shared_projects` instead). Supports optional `search` (filter by name or ID) and `limit` (default 10) parameters.

- `cursor` (string, optional)
  Specify the cursor value from the previous response to retrieve the next batch of projects.
- `limit` (number, optional, default: 10)
  Specify a value from 1 to 400 to limit number of projects in the response.
- `search` (string, optional)
  Search by project name or id. You can specify partial name or id values to filter results.
- `org_id` (string, optional)
  Search for projects by org_id.

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
