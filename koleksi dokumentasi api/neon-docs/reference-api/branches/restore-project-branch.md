---
operationId: "restoreProjectBranch"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/restore"
tag: "branches"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Branches / Restore branch to a historical state

## POST /projects/{project_id}/branches/{branch_id}/restore

Restores a branch to an earlier state in its own or another branch's history
by specifying an LSN or timestamp.
Creates a new branch from the historical state.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `source_branch_id` (string, required)
  The `branch_id` of the restore source branch.
  If `source_timestamp` and `source_lsn` are omitted, the branch will be restored to head.
  If `source_branch_id` is equal to the branch's id, `source_timestamp` or `source_lsn` is required.
  
- `source_lsn` (string, optional)
  A Postgres LSN (for example, `0/1A2B3C4`) on the source branch to restore from.
  Mutually exclusive with `source_timestamp`. Omit both to restore to head.
  
- `source_timestamp` (string, optional, format: date-time)
  A point in time on the source branch to restore from, in RFC 3339 format. When omitted alongside `source_lsn`, the branch is restored to the latest available state of the source branch.
  
- `preserve_under_name` (string, optional)
  Name under which to save the current branch state before restoring. Required when the branch has children or when `source_branch_id` equals the branch being restored; in those cases all existing child branches are moved to the newly created branch. If omitted and not required, the previous state is not preserved.
  

### Response (200)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-a5b6c7d8",
    "parent_lsn": "0/1964350",
    "parent_timestamp": "2025-01-15T10:30:00Z",
    "name": "my-branch-11",
    "slug": "br-young-forest-a5b6c7d8",
    "current_state": "resetting",
    "pending_state": "ready",
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
    "last_reset_at": "2025-01-15T10:30:00Z",
    "init_source": "parent-data"
  },
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "suspend_compute",
      "status": "running",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "action": "create_branch",
      "status": "scheduling",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "action": "delete_timeline",
      "status": "scheduling",
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/restore" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.restoreProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon branches restore <id|name>
```

### MCP

Tool: `reset_from_parent`

Reset a branch to its parent's current state, discarding all changes made on the branch. NEVER run autonomously; always ask the user first. Use `preserveUnderName` to preserve the current state under a new branch name before resetting.

- `projectId` (string, required)
  The ID of the project containing the branch
- `branchIdOrName` (string, required)
  The name or ID of the branch to reset from its parent
- `preserveUnderName` (string, optional)
  Optional name to preserve the current state under a new branch before resetting

### Console

Console path: Projects → Backup & restore

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
