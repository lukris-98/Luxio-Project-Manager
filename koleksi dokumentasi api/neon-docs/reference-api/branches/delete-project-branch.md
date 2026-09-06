---
operationId: "deleteProjectBranch"
method: "DELETE"
path: "/projects/{project_id}/branches/{branch_id}"
tag: "branches"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Branches / Delete branch

## DELETE /projects/{project_id}/branches/{branch_id}

Deletes the specified branch from a project and places all compute endpoints into an idle state, breaking existing client connections.

The deletion completes after all operations finish.
You cannot delete a project's root or default branch, or a branch that has a child branch.
A project must have at least one branch.

By default, deleted branches can be recovered within a 7-day grace period.
Use the `hard_delete` parameter to permanently delete the branch immediately.
For related information, see [Manage branches](https://neon.com/docs/manage/branches/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `hard_delete` (boolean, query, optional)
  If true, the branch is permanently deleted immediately without a recovery window.
  If false (default), the branch can be recovered within 7 days via the recover endpoint.
  
  This parameter is part of the Branch Recovery feature, which is in preview and not available to all users.
  
  Default: `false`

### Response (200)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-a5b6c7d8",
    "parent_lsn": "0/196A488",
    "parent_timestamp": "2025-01-15T10:30:00Z",
    "name": "my-branch-14",
    "slug": "br-young-forest-a5b6c7d8",
    "current_state": "ready",
    "pending_state": "storage_deleted",
    "state_changed_at": "2025-01-15T10:30:00Z",
    "creation_source": "console",
    "primary": false,
    "default": false,
    "protected": false,
    "cpu_used_sec": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "written_data_bytes": 0,
    "data_transfer_bytes": 0,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "init_source": "parent-data"
  },
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "action": "delete_timeline",
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon branches delete <branch_id>
```

### MCP

Tool: `delete_branch`

Delete a branch and all its data. NEVER run autonomously; always ask the user first. For deleting an entire project, use `delete_project` instead.

- `projectId` (string, required)
  The ID of the project containing the branch
- `branchId` (string, required)
  The ID of the branch to delete

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
