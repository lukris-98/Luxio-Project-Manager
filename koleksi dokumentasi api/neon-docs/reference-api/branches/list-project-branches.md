---
operationId: "listProjectBranches"
method: "GET"
path: "/projects/{project_id}/branches"
tag: "branches"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Branches / List branches

## GET /projects/{project_id}/branches

Retrieves a list of branches for the specified project.

Each Neon project has a root branch named `main`.
A `branch_id` value has a `br-` prefix.
A project may contain child branches that were branched from `main` or from another branch.
A parent branch is identified by the `parent_id` value, which is the `id` of the parent branch.
For related information, see [Manage branches](https://neon.com/docs/manage/branches/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `search` (string, query, optional)
  Search by branch `name` or `id`. You can specify partial `name` or `id` values to filter results.
- `sort_by` (string, query, optional)
  Sort the branches by sort_field. If not provided, branches will be sorted by updated_at descending order
  Default: `updated_at`
- `cursor` (string, query, optional)
  A cursor to use in pagination. A cursor defines your place in the data list. Include `response.pagination.next` in subsequent API calls to fetch next page of the list.
- `sort_order` (string, query, optional)
  Defines the sorting order of entities.
  Default: `desc`
- `limit` (integer, query, optional)
  The maximum number of records to be returned in the response
- `include_deleted` (boolean, query, optional)
  If true, return recoverable deleted branches too (soft-deleted within the recovery window).
  If false or not provided, return only active (non-deleted) branches.
  
  This parameter is part of the Branch Recovery feature, which is in preview and not available to all users.
  
  Default: `false`

### Response (200)

```json
{
  "branches": [
    {
      "id": "br-young-forest-a5b6c7d8",
      "project_id": "aged-wildflower-123456",
      "parent_id": "br-young-forest-12345678",
      "parent_lsn": "0/1964D68",
      "parent_timestamp": "2025-01-15T10:30:00Z",
      "name": "my-branch-3",
      "slug": "br-young-forest-a5b6c7d8",
      "project_slug": "aged-wildflower-123456",
      "current_state": "ready",
      "state_changed_at": "2025-01-15T11:00:00Z",
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
      "updated_at": "2025-01-15T11:00:00Z",
      "init_source": "parent-data"
    },
    {
      "id": "br-young-forest-12345678",
      "project_id": "aged-wildflower-123456",
      "parent_id": "br-young-forest-12345678",
      "parent_lsn": "0/1964D68",
      "parent_timestamp": "2025-01-15T10:30:00Z",
      "name": "my-branch-2",
      "slug": "br-young-forest-12345678",
      "project_slug": "aged-wildflower-123456",
      "current_state": "ready",
      "state_changed_at": "2025-01-15T11:00:00Z",
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
      "updated_at": "2025-01-15T11:00:00Z",
      "init_source": "parent-data"
    }
  ],
  "annotations": {},
  "pagination": {
    "next": "eyJicmFuY2hfaWQiOiJici15b3VuZy1mb3Jlc3QtYTViNmM3ZDgiLCJzb3J0X2J5IjoidXBkYXRlZF9hdCIsInNvcnRfYnlfdmFsdWUiOiIyMDI1LTAxLTE1VDEwOjMwOjAwWiIsInNvcnRfb3JkZXIiOiJERVNDIn0=",
    "sort_by": "updated_at",
    "sort_order": "DESC"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranches({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon branches list
```

### MCP

Tool: `describe_project`

Get details and configuration of a specific Neon project. Do not use when you need to list all projects (use `list_projects` instead).

- `projectId` (string, required)
  The ID of the project to describe

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
