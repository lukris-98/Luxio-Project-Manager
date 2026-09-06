---
operationId: "getProjectBranch"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}"
tag: "branches"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Branches / Retrieve branch details

## GET /projects/{project_id}/branches/{branch_id}

Retrieves information about the specified branch.
A `branch_id` value has a `br-` prefix.

Each Neon project is initially created with a root and default branch named `main`.
A project can contain one or more branches.
A parent branch is identified by a `parent_id` value, which is the `id` of the parent branch.
For related information, see [Manage branches](https://neon.com/docs/manage/branches/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-a5b6c7d8",
    "parent_lsn": "0/1959918",
    "parent_timestamp": "2025-01-15T10:30:00Z",
    "name": "dev",
    "slug": "br-young-forest-a5b6c7d8",
    "project_slug": "aged-wildflower-123456",
    "current_state": "ready",
    "state_changed_at": "2025-01-15T11:00:00Z",
    "logical_size": 38879232,
    "creation_source": "console",
    "primary": false,
    "default": false,
    "protected": false,
    "cpu_used_sec": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "written_data_bytes": 0,
    "data_transfer_bytes": 0,
    "created_at": "2025-01-15T11:00:00Z",
    "updated_at": "2025-01-15T11:30:00Z",
    "init_source": "parent-data"
  },
  "annotation": {
    "object": {
      "type": "",
      "id": ""
    },
    "value": {}
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon branches get <id|name>
```

### MCP

Tool: `describe_branch`

Get a tree view of all objects in a branch, including databases, schemas, tables, views, and functions. Do not use when you only need table names (use `get_database_tables` instead) or column detail (use `describe_table_schema` instead).

- `projectId` (string, required)
  The ID of the project
- `branchId` (string, required)
  An ID of the branch to describe
- `databaseName` (string, optional)

### Console

Console path: Projects → Branches

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
