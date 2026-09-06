---
operationId: "createProjectBranchDatabase"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/databases"
tag: "branches"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Branches / Create database

## POST /projects/{project_id}/branches/{branch_id}/databases

Creates a database in the specified branch.
A branch can have multiple databases.
For related information, see [Manage databases](https://neon.com/docs/manage/databases/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `database` (object, required)
  Configuration for the new Postgres database.
  - `name` (string, required)
    Name of the database to create.
    
  - `owner_name` (string, required)
    The name of the role that owns the database
    

```json
{
  "database": {
    "name": "mydb",
    "owner_name": "casey"
  }
}
```

### Response (201)

```json
{
  "database": {
    "id": 1000000,
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "my-database-2",
    "owner_name": "alex",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
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
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"database":{"name":"mydb","owner_name":"casey"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchDatabase({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  body: {
    database: {
      name: "mydb",
      owner_name: "casey"
    }
  }
});
```

```bash
# neonctl
neon databases create
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
