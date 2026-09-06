---
operationId: "createProjectBranch"
method: "POST"
path: "/projects/{project_id}/branches"
tag: "branches"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Branches / Create branch

## POST /projects/{project_id}/branches

Creates a branch in the specified project.
No request body is required, but you can specify one to create a compute endpoint or select a non-default parent branch.
By default, the branch is created from the project's default branch with no compute endpoint, and the branch name is auto-generated.
To access the branch, add a `read_write` endpoint.
Each branch supports one read-write endpoint and multiple read-only endpoints.
For related information, see [Manage branches](https://neon.com/docs/manage/branches/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `endpoints` (array, optional)
  Compute endpoints to create together with the branch. If omitted, the branch is created without any compute endpoint. Endpoints can be added to the branch separately after creation.
  - `type` (string, required)
    Compute endpoint type. `read_write`: the primary read-write endpoint (one per branch). `read_only`: a read replica endpoint (multiple allowed per branch).
    Possible values: `read_only`, `read_write`
  - `settings` (object, optional)
    Compute endpoint settings: `pg_settings` (Postgres parameter overrides such as `work_mem`, `max_connections`) and `preload_libraries`.
    - `pg_settings` (object, optional)
      A raw representation of Postgres settings
    - `pgbouncer_settings` (object, optional, deprecated)
      Deprecated. PgBouncer settings for the compute endpoint. Removal scheduled for June 20, 2026.
      
    - `preload_libraries` (object, optional)
      The shared libraries to preload into the project's compute instances.
      
      - `use_defaults` (boolean, optional)
        When true, the project's preload libraries include the platform default set in addition to any libraries listed in `enabled_libraries`.
      - `enabled_libraries` (array, optional)
        Names of shared preload libraries to enable for the project.
  - `autoscaling_limit_min_cu` (number, optional)
    Minimum number of Compute Units the endpoint can scale down to. Minimum 0.25.
    
  - `autoscaling_limit_max_cu` (number, optional)
    Maximum number of Compute Units the endpoint can scale up to. Minimum 0.25.
    
  - `provisioner` (string, optional)
    Compute provisioner. `k8s-neonvm` (default) supports Autoscaling; `k8s-pod` is fixed-size compute. Also `docker` and `serverless-platform`.
  - `suspend_timeout_seconds` (integer, optional, format: int64)
    Scale-to-zero idle timeout, in seconds, before the compute suspends. `0` uses the plan default; `-1` disables scale-to-zero (never suspends). Minimum is plan-dependent (Scale: 60); maximum 604800 (one week). Free cannot change it; Launch can only enable or disable; Scale can set any value.
- `branch` (object, optional)
  Optional configuration for the new branch, for example `name`, `parent_id` (fork from a branch), `parent_lsn` or `parent_timestamp` (point-in-time branching), and `protected`.
  - `parent_id` (string, optional)
    The `branch_id` of the parent branch. If omitted or empty, the branch will be created from the project's default branch.
    
  - `name` (string, optional)
    The branch name
    
  - `parent_lsn` (string, optional)
    A Log Sequence Number (LSN) on the parent branch. The branch will be created with data from this LSN.
    
  - `parent_timestamp` (string, optional, format: date-time)
    A timestamp identifying a point in time on the parent branch. The branch will be created with data starting from this point in time. RFC 3339 format.
    
  - `protected` (boolean, optional)
    Whether the branch is protected. Protected branches (and their computes) cannot be deleted, archived, or reset, and block deletion of the project. Can be gated by `protected_branches_only` in the IP allowlist. Paid plans only.
    
    Default: `false`
  - `archived` (boolean, optional)
    Whether to create the branch in the archived state. When omitted, the branch is created as a normal (non-archived) branch.
    
  - `init_source` (string, optional)
    Source of initialization for the branch. `parent-data` copies schema and data from the parent branch. `parent-schema` copies schema only from the parent branch. `schema-only` creates a new root branch containing schema only, using `parent_id` as the source; optionally, `parent_lsn` or `parent_timestamp` can narrow the source point. `import` initializes the branch from an external import.
  - `expires_at` (string, optional, format: date-time)
    The timestamp when the branch is scheduled to expire and be automatically deleted. Must be set by the client following the [RFC 3339, section 5.6](https://tools.ietf.org/html/rfc3339#section-5.6) format with precision up to seconds (such as 2025-06-09T18:02:16Z). Deletion is performed by a background job and may not occur exactly at the specified time.
    
    Access to this feature is currently limited to participants in the Early Access Program.
    
- `annotation_value` (object, optional)
  A free-form map of string key-value pairs for attaching metadata to a resource (for example, a git commit reference). Maximum 50 entries.

```json
{
  "branch": {
    "name": "my-feature-branch"
  }
}
```

### Response (201)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-12345678",
    "parent_lsn": "0/1964D68",
    "name": "my-branch-2",
    "slug": "br-young-forest-a5b6c7d8",
    "project_slug": "aged-wildflower-123456",
    "current_state": "init",
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
    "init_source": "parent-data"
  },
  "endpoints": [],
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "action": "create_branch",
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
      "action": "timeline_update_protected_config",
      "status": "scheduling",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    }
  ],
  "roles": [
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "authenticator",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "anonymous",
      "protected": false,
      "authentication_method": "no_login",
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "authenticated",
      "protected": false,
      "authentication_method": "no_login",
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    },
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb_owner",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T11:30:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    }
  ],
  "databases": [
    {
      "id": 1000000,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb",
      "owner_name": "neondb_owner",
      "created_at": "2025-01-15T11:30:00Z",
      "updated_at": "2025-01-15T11:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"branch":{"name":"my-feature-branch"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  },
  body: {
    branch: {
      name: "my-feature-branch"
    }
  }
});
```

```bash
# neonctl
neon branches create
```

### MCP

Tool: `create_branch`

Create a branch in a Neon project for isolated development or testing. By default the branch is created from the project's default branch; pass `parentId` to fork an existing non-default branch instead (e.g. to make a disposable copy of a dev/staging branch).

- `projectId` (string, required)
  The ID of the project to create the branch in
- `branchName` (string, optional)
  An optional name for the branch
- `parentId` (string, optional)
  An optional branch ID (e.g. 'br-...') to branch from. If omitted, the branch is created from the project's default branch. Use this to fork an existing non-default branch — for example, to make an isolated copy of a dev/staging branch for experimentation.
- `expiresAt` (string, optional)
  An optional ISO 8601 timestamp after which Neon automatically deletes the branch.

### Console

Console path: Projects → Branches → New branch

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
