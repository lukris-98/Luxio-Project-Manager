---
operationId: "listProjectBranchRoles"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/roles"
tag: "branches"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Branches / List roles

## GET /projects/{project_id}/branches/{branch_id}/roles

Retrieves a list of Postgres roles from the specified branch.
For related information, see [Manage roles](https://neon.com/docs/manage/roles/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "roles": [
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "alex",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb_owner",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:30:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "authenticator",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "authenticated",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "anonymous",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-role-2",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T12:30:00Z",
      "updated_at": "2025-01-15T12:30:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-role",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T13:00:00Z",
      "updated_at": "2025-01-15T13:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-role-3",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T12:30:00Z",
      "updated_at": "2025-01-15T12:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/roles" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchRoles({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon connection-string [branch] list
```

### Console

Console path: Projects → Branches → Roles & Databases

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
