# Branches

Neon branches are copy-on-write clones of your database, created from any point in time. A new branch shares storage with its parent until it diverges. Common uses include per-PR preview environments, testing schema changes before promoting them, and point-in-time recovery.

You cannot delete a project's root branch. You also cannot delete a branch that has children; delete all children first.

You can also manage branches from the CLI with [`neon branches`](/docs/cli/branches).

See [Branching with the Neon API](/docs/guides/branching-neon-api) for end-to-end examples, and [Automate branching with GitHub Actions](/docs/guides/branching-github-actions) for CI/CD workflows using Neon's create, delete, reset, and schema diff actions.

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

---

> API Reference / Branches / Create anonymized branch

## POST /projects/{project_id}/branch_anonymized

Creates a new branch with anonymized data using PostgreSQL Anonymizer for static masking.
This allows developers to work with masked production data.
Optionally, provide `masking_rules` to set initial masking rules for the branch
and `start_anonymization` to automatically start anonymization after creation. This
combines functionality of updating masking rules and starting anonymization into the
branch creation request.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `annotation_value` (object, optional)
  A free-form map of string key-value pairs for attaching metadata to a resource (for example, a git commit reference). Maximum 50 entries.
- `branch_create` (object, optional)
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
      
- `masking_rules` (array, optional)
  List of masking rules to apply to the branch.
  
  - `database_name` (string, required)
    The name of the database containing the table to be masked
    
  - `schema_name` (string, required)
    The name of the schema containing the table to be masked
    
  - `table_name` (string, required)
    The name of the table containing the column to be masked
    
  - `column_name` (string, required)
    The name of the column to be masked
    
  - `masking_function` (string, optional)
    The PostgreSQL Anonymizer masking function to apply.
    Can be a predefined function (e.g., 'anon.random_string(10)', 'anon.fake_email()')
    or a custom function definition (e.g., 'anon.hash(column_name)')
    
  - `masking_value` (string, optional)
    A literal value to set on the column when masking.
    
- `start_anonymization` (boolean, optional)
  If true, automatically start anonymization after the branch is created.
  Defaults to false.
  
  Default: `false`

### Response (201)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-12345678",
    "parent_lsn": "0/1964E60",
    "name": "br-young-forest-a5b6c7d8",
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
    "init_source": "parent-data",
    "restricted_actions": [
      {
        "name": "restore",
        "reason": "cannot restore anonymized branches"
      },
      {
        "name": "delete-rw-endpoint",
        "reason": "cannot delete read-write endpoints for anonymized branches"
      },
      {
        "name": "connect-to-endpoints",
        "reason": "cannot connect to endpoints while branch is being anonymized"
      }
    ]
  },
  "endpoints": [
    {
      "host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
      "hosts": {
        "read_write_host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
        "read_write_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-5.us-east-2.aws.neon.tech"
      },
      "id": "ep-cool-darkness-a5b6c7d8",
      "slug": "ep-cool-darkness-a5b6c7d8",
      "branch_slug": "br-young-forest-a5b6c7d8",
      "project_slug": "aged-wildflower-123456",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "region_id": "aws-us-east-2",
      "type": "read_write",
      "current_state": "init",
      "pending_state": "active",
      "group": {
        "size": {
          "min": 1,
          "max": 1
        },
        "allow_readable_secondaries": false,
        "computes": [
          {
            "binding_id": "ffk",
            "current_state": "init",
            "pending_state": "active",
            "role": "read_write",
            "compute_host": "ep-cool-darkness-a5b6c7d8-ffk.c-5.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-ffk-pooler.c-5.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-15T10:30:00Z"
          }
        ]
      },
      "settings": {
        "preload_libraries": {
          "use_defaults": false,
          "enabled_libraries": [
            "anon"
          ]
        }
      },
      "pooler_enabled": false,
      "pooler_mode": "transaction",
      "disabled": false,
      "passwordless_access": true,
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm"
    }
  ],
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
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "start_compute",
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branch_anonymized" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchAnonymized({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

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

---

> API Reference / Branches / Retrieve number of branches

## GET /projects/{project_id}/branches/count

Retrieves the total number of branches in the specified project.
Supports an optional `search` parameter to count branches matching a name filter.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `search` (string, query, optional)
  Count branches matching the `name` in search query

### Response (200)

```json
{
  "count": 5
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/count" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.countProjectBranches({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

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

---

> API Reference / Branches / Update branch

## PATCH /projects/{project_id}/branches/{branch_id}

Updates the specified branch.
For more information, see [Manage branches](https://neon.com/docs/manage/branches/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `branch` (object, required)
  Branch attributes to update. Supply only the fields you want to change, for example `name` or `protected`.
  - `name` (string, optional)
    New display name for the branch.
  - `protected` (boolean, optional)
    Whether the branch is protected. Protected branches (and their computes) cannot be deleted, archived, or reset, and block deletion of the project. Can be gated by `protected_branches_only` in the IP allowlist. Paid plans only.
    
  - `expires_at` (string, optional, format: date-time)
    The timestamp when the branch is scheduled to expire and be automatically deleted. Must be set by the client following the [RFC 3339, section 5.6](https://tools.ietf.org/html/rfc3339#section-5.6) format with precision up to seconds (such as 2025-06-09T18:02:16Z). Deletion is performed by a background job and may not occur exactly at the specified time. If this field is set to null, the expiration timestamp is removed.
    
    Access to this feature is currently limited to participants in the Early Access Program.
    

```json
{
  "branch": {
    "name": "mybranch"
  }
}
```

### Response (200)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-a5b6c7d8",
    "parent_lsn": "0/1964258",
    "parent_timestamp": "2025-01-15T10:30:00Z",
    "name": "my-branch-5-renamed",
    "slug": "br-young-forest-a5b6c7d8",
    "project_slug": "aged-wildflower-123456",
    "current_state": "ready",
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
  "operations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"branch":{"name":"mybranch"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  body: {
    branch: {
      name: "mybranch"
    }
  }
});
```

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

---

> API Reference / Branches / Retrieve database schema

## GET /projects/{project_id}/branches/{branch_id}/schema

Retrieves the database schema. Specify `lsn` or `timestamp` (not both) to read at a point in time; omit both to read from the database's head.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `db_name` (string, query, required)
  Name of the database for which the schema is retrieved
- `lsn` (string, query, optional)
  The Log Sequence Number (LSN) for which the schema is retrieved
  
- `timestamp` (string, query, optional)
  The point in time for which the schema is retrieved
  
- `format` (string, query, optional)
  The format of the schema to retrieve. Possible values:
  - `sql` (default)
  - `json`
  

### Response (200)

```json
{
  "sql": "--\n-- PostgreSQL database dump\n--\n\n-- Dumped from database version 17.10 (4f20678)\n-- Dumped by pg_dump version 17.10 (4f20678)\n\nSET statement_timeout = 0;\nSET lock_timeout = 0;\nSET idle_in_transaction_session_timeout = 0;\nSET transaction_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\nSELECT pg_catalog.set_config('search_path', '', false);\nSET check_function_bodies = false;\nSET xmloption = content;\nSET client_min_messages = warning;\nSET row_security = off;\n\n--\n-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin\n--\n\nALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;\n\n\n--\n-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin\n--\n\nALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;\n\n\n--\n-- PostgreSQL database dump complete\n--\n\n"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/schema?db_name=$DB_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchSchema({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  query: {
    db_name: process.env.DB_NAME,
    timestamp: "2022-11-30T20:09:48Z"
  }
});
```

```bash
# neonctl
neon branches schema-diff [base] [compare]
```

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

---

> API Reference / Branches / Compare database schema

## GET /projects/{project_id}/branches/{branch_id}/compare_schema

Compares the schema from the specified database with another branch's schema.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `base_branch_id` (string, query, optional)
  The branch ID to compare the schema with
- `db_name` (string, query, required)
  Name of the database for which the schema is retrieved
- `lsn` (string, query, optional)
  The Log Sequence Number (LSN) for which the schema is retrieved
  
- `timestamp` (string, query, optional)
  The point in time for which the schema is retrieved
  
- `base_lsn` (string, query, optional)
  The Log Sequence Number (LSN) for the base branch schema
  
- `base_timestamp` (string, query, optional)
  The point in time for the base branch schema
  

### Response (200)

```json
{
  "diff": "--- a/neondb\n+++ b/neondb\n@@ -18,100 +18,404 @@\n SET row_security = off;\n \n --\n--- Name: pg_session_jwt; Type: EXTENSION; Schema: -; Owner: -\n+-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth\n --\n \n-CREATE EXTENSION IF NOT EXISTS pg_session_jwt WITH SCHEMA public;\n+CREATE SCHEMA neon_auth;\n \n \n+ALTER SCHEMA neon_auth OWNER TO neon_auth;\n+\n+SET default_tablespace = '';\n+\n+SET default_table_access_method = heap;\n+\n --\n--- Name: EXTENSION pg_session_jwt; Type: COMMENT; Schema: -; Owner: \n+-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth\n --\n \n-COMMENT ON EXTENSION pg_session_jwt IS 'pg_session_jwt: manage authentication sessions using JWTs';\n+CREATE TABLE neon_auth.account (\n+    id uuid DEFAULT gen_random_uuid() NOT NULL,\n+    \"accountId\" text NOT NULL,\n+    \"providerId\" text NOT NULL,\n+    \"userId\" uuid NOT NULL,\n+    \"accessToken\" text,\n+    \"refreshToken\" text,\n+    \"idToken\" text,\n+    \"accessTokenExpiresAt\" timestamp with time zone,\n+    \"refreshTokenExpiresAt\" timestamp with time zone,\n+    scope text,\n+    password text,\n+    \"createdAt\" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,\n+    \"updatedAt\" timestamp with time zone NOT NULL\n… (truncated for docs)"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/compare_schema?db_name=$DB_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchSchemaComparison({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  query: {
    db_name: process.env.DB_NAME,
    timestamp: "2022-11-30T20:09:48Z",
    base_timestamp: "2022-11-30T20:09:48Z"
  }
});
```

### MCP

Tool: `compare_database_schema`

<use_case> Use this tool to compare the schema of a database between two branches. The output of the tool is a JSON object with one field: `diff`. <example> ```json { "diff": "--- a/neondb +++ b/neondb @@ -27,7 +27,10 @@ CREATE TABLE public.users ( id integer NOT NULL, - username character varying(50) NOT NULL + username character varying(50) NOT NULL, + is_deleted boolean DEFAULT false NOT NULL, + created_at timestamp with time zone DEFAULT now() NOT NULL, + updated_at timestamp with time zone ); @@ -79,6 +82,13 @@ -- +-- Name: users_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner +-- + +CREATE INDEX users_created_at_idx ON public.users USING btree (created_at DESC) WHERE (is_deleted = false); + + +-- -- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin -- " } ``` </example> At this field you will find a difference between two schemas. The diff represents the changes required to make the parent branch schema match the child branch schema. The diff field contains a unified diff (git-style patch) as a string. You MUST be able to generate a zero-downtime migration from the diff and apply it to the parent branch. (This branch is a child and has a parent. You can get parent id just querying the branch details.) </use_case> <important_notes> To generate schema diff, you MUST SPECIFY the `database_name`. If `database_name` is not specified, you MUST fall back to the default database name: ``. You MUST TAKE INTO ACCOUNT the PostgreSQL version. The PostgreSQL version is the same for both branches. You MUST ASK user consent before running each generated SQL query. You SHOULD USE `run_sql` tool to run each generated SQL query. You SHOULD suggest creating a backup or point-in-time restore before running the migration. Generated queries change the schema of the parent branch and MIGHT BE dangerous to execute. Generated SQL migrations SHOULD be idempotent where possible (i.e., safe to run multiple times without failure) and include `IF NOT EXISTS` / `IF EXISTS` where applicable. You SHOULD recommend including comments in generated SQL linking back to diff hunks (e.g., `-- from diff @@ -27,7 +27,10 @@`) to make audits easier. Generated SQL should be reviewed for dependencies (e.g., foreign key order) before execution. </important_notes> <next_steps> After executing this tool, you MUST follow these steps: 1. Review the schema diff and suggest generating a zero-downtime migration. 2. Follow these instructions to respond to the client: <response_instructions> <instructions> Provide brief information about the changes: * Tables * Views * Indexes * Ownership * Constraints * Triggers * Policies * Extensions * Schemas * Sequences * Tablespaces * Users * Roles * Privileges </instructions> </response_instructions> 3. If a migration fails, you SHOULD guide the user on how to revert the schema changes, for example by using backups, point-in-time restore, or generating reverse SQL statements (if safe). </next_steps> This tool: 1. Generates a diff between the child branch and its parent. 2. Generates a SQL migration from the diff. 3. Suggest generating zero-downtime migration. <workflow> 1. User asks you to generate a diff between two branches. 2. You suggest generating a SQL migration from the diff. 3. Ensure the generated migration is zero-downtime; otherwise, warn the user. 4. You ensure that your suggested migration is also matching the PostgreSQL version. 5. You use `run_sql` tool to run each generated SQL query and ask the user consent before running it. Before requesting user consent, present a summary of all generated SQL statements along with their potential impact (e.g., table rewrites, lock risks, validation steps) so the user can make an informed decision. 6. Propose to rerun the schema diff tool one more time to ensure that the migration is applied correctly. 7. If the diff is empty, confirm that the parent schema now matches the child schema. 8. If the diff is not empty after migration, warn the user and assist in resolving the remaining differences. </workflow> <hints> <hint> Adding the column with a `DEFAULT` static value will not have any locks. But if the function is called that is not deterministic, it will have locks. <example> ```sql -- No table rewrite, minimal lock time ALTER TABLE users ADD COLUMN status text DEFAULT 'active'; ``` </example> There is an example of a case where the function is not deterministic and will have locks: <example> ```sql -- Table rewrite, potentially longer lock time ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT now(); ``` The fix for this is next: ```sql -- Adding a nullable column first ALTER TABLE users ADD COLUMN created_at timestamptz; -- Setting the default value because the rows are updated UPDATE users SET created_at = now(); ``` </example> </hint> <hint> Adding constraints in two phases (including foreign keys) <example> ```sql -- Step 1: Add constraint without validating existing data -- Fast - only blocks briefly to update catalog ALTER TABLE users ADD CONSTRAINT users_age_positive CHECK (age > 0) NOT VALID; -- Step 2: Validate existing data (can take time but doesn't block writes) -- Uses SHARE UPDATE EXCLUSIVE lock - allows reads/writes ALTER TABLE users VALIDATE CONSTRAINT users_age_positive; ``` </example> <example> ```sql -- Step 1: Add foreign key without validation -- Fast - only updates catalog, doesn't validate existing data ALTER TABLE orders ADD CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID; -- Step 2: Validate existing relationships -- Can take time but allows concurrent operations ALTER TABLE orders VALIDATE CONSTRAINT orders_user_id_fk; ``` </example> </hint> <hint> Setting columns to NOT NULL <example> ```sql -- Step 1: Add a check constraint (fast with NOT VALID) ALTER TABLE users ADD CONSTRAINT users_email_not_null CHECK (email IS NOT NULL) NOT VALID; -- Step 2: Validate the constraint (allows concurrent operations) ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null; -- Step 3: Set NOT NULL (fast since constraint guarantees no nulls) ALTER TABLE users ALTER COLUMN email SET NOT NULL; -- Step 4: Drop the redundant check constraint ALTER TABLE users DROP CONSTRAINT users_email_not_null; ``` </example> <example> For PostgreSQL v18+ (to get PostgreSQL version, you can use `describe_project` tool or `run_sql` tool and execute `SELECT version();` query) ```sql -- PostgreSQL 18+ - Simplified approach ALTER TABLE users ALTER COLUMN email SET NOT NULL NOT VALID; ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null; ``` </example> </hint> <hint> In some cases, you need to combine two approaches to achieve a zero-downtime migration. <example> ```sql -- Step 1: Adding a nullable column first ALTER TABLE users ADD COLUMN created_at timestamptz; -- Step 2: Updating the all rows with the default value UPDATE users SET created_at = now() WHERE created_at IS NULL; -- Step 3: Creating a not null constraint ALTER TABLE users ADD CONSTRAINT users_created_at_not_null CHECK (created_at IS NOT NULL) NOT VALID; -- Step 4: Validating the constraint ALTER TABLE users VALIDATE CONSTRAINT users_created_at_not_null; -- Step 5: Setting the column to NOT NULL ALTER TABLE users ALTER COLUMN created_at SET NOT NULL; -- Step 6: Dropping the redundant NOT NULL constraint ALTER TABLE users DROP CONSTRAINT users_created_at_not_null; -- Step 7: Adding the default value ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now(); ``` </example> For PostgreSQL v18+ <example> ```sql -- Step 1: Adding a nullable column first ALTER TABLE users ADD COLUMN created_at timestamptz; -- Step 2: Updating the all rows with the default value UPDATE users SET created_at = now() WHERE created_at IS NULL; -- Step 3: Creating a not null constraint ALTER TABLE users ALTER COLUMN created_at SET NOT NULL NOT VALID; -- Step 4: Validating the constraint ALTER TABLE users VALIDATE CONSTRAINT users_created_at_not_null; -- Step 5: Adding the default value ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now(); ``` </example> </hint> <hint> Create index CONCURRENTLY <example> ```sql CREATE INDEX CONCURRENTLY idx_users_email ON users (email); ``` </example> </hint> <hint> Drop index CONCURRENTLY <example> ```sql DROP INDEX CONCURRENTLY idx_users_email; ``` </example> </hint> <hint> Create materialized view WITH NO DATA <example> ```sql CREATE MATERIALIZED VIEW mv_users AS SELECT name FROM users WITH NO DATA; ``` </example> </hint> <hint> Refresh materialized view CONCURRENTLY <example> ```sql REFRESH MATERIALIZED VIEW CONCURRENTLY mv_users; ``` </example> </hint> </hints>

- `projectId` (string, required)
  The ID of the project
- `branchId` (string, required)
  The ID of the branch
- `databaseName` (string, required)

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

---

> API Reference / Branches / Retrieve masking rules

## GET /projects/{project_id}/branches/{branch_id}/masking_rules

Retrieves the masking rules for the specified anonymized branch.
Masking rules define how sensitive data should be anonymized using PostgreSQL Anonymizer.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "masking_rules": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/masking_rules" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getMaskingRules({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Console

Console path: Projects → Branches → Data Masking

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

---

> API Reference / Branches / Update masking rules

## PATCH /projects/{project_id}/branches/{branch_id}/masking_rules

Updates the masking rules for the specified anonymized branch.
Masking rules define how sensitive data should be anonymized using PostgreSQL Anonymizer.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `masking_rules` (array, required)
  List of masking rules to apply to the branch.
  This will replace all existing masking rules for the branch.
  
  - `database_name` (string, required)
    The name of the database containing the table to be masked
    
  - `schema_name` (string, required)
    The name of the schema containing the table to be masked
    
  - `table_name` (string, required)
    The name of the table containing the column to be masked
    
  - `column_name` (string, required)
    The name of the column to be masked
    
  - `masking_function` (string, optional)
    The PostgreSQL Anonymizer masking function to apply.
    Can be a predefined function (e.g., 'anon.random_string(10)', 'anon.fake_email()')
    or a custom function definition (e.g., 'anon.hash(column_name)')
    
  - `masking_value` (string, optional)
    A literal value to set on the column when masking.
    

### Response (200)

```json
{
  "masking_rules": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/masking_rules" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateMaskingRules({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Console

Console path: Projects → Branches → Data Masking

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

---

> API Reference / Branches / Retrieve anonymized branch status

## GET /projects/{project_id}/branches/{branch_id}/anonymized_status

Retrieves the current status of an anonymized branch, including its state and progress information.
This endpoint allows you to monitor the anonymization process from initialization through completion.
Only anonymized branches will have status information available.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "project_id": "aged-wildflower-123456",
  "branch_id": "br-young-forest-a5b6c7d8",
  "state": "initialized",
  "status_message": "Successfully initialized PostgreSQL Anonymizer on all databases",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/anonymized_status" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getAnonymizedBranchStatus({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Console

Console path: Projects → Branches → Data Masking

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

---

> API Reference / Branches / Start anonymization

## POST /projects/{project_id}/branches/{branch_id}/anonymize

Starts the anonymization process for an anonymized branch that is in the initialized, error, or anonymized state.
This will apply all defined masking rules to anonymize sensitive data in the branch databases.
The branch must be an anonymized branch to start anonymization.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

- `project_id` (string, optional)
  The ID of the project this branch belongs to.
- `branch_id` (string, optional)
  The ID of the anonymized branch.
- `state` (string, optional)
  The current state of the anonymized branch. `created`: branch record exists but setup has not started. `initialized`: setup is complete and the branch is ready for anonymization. `initialization_error`: an error occurred during setup. `anonymizing`: the anonymization process is currently running. `anonymized`: anonymization completed successfully. `error`: an error occurred during anonymization.
  
- `status_message` (string, optional)
  A descriptive message about the current status or any errors
  
- `created_at` (string, optional, format: date-time)
  A timestamp indicating when the anonymized branch was created
  
- `updated_at` (string, optional, format: date-time)
  A timestamp indicating when the anonymized branch status was last updated
  
- `failed_at` (string, optional, format: date-time)
  A timestamp indicating when the anonymized branch operation failed (if applicable)
  
- `last_run` (object, optional)
  Metadata about the most recent anonymization attempt for the branch.
  - `started_at` (string, optional, format: date-time)
    Timestamp indicating when the latest anonymization attempt started.
    
  - `completed_at` (string, optional, format: date-time)
    Timestamp indicating when the latest anonymization attempt completed.
    Populated even if the attempt failed.
    
  - `triggered_by` (string, optional, format: uuid)
    UUID of the user who triggered the latest anonymization attempt.
    
  - `triggered_by_username` (string, optional)
    Username of the user who triggered the latest anonymization attempt.
    
  - `masked_columns` (integer, optional)
    Number of columns that had masking rules applied during the attempt.
    

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/anonymize" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.startAnonymization({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Console

Console path: Projects → Branches → Data Masking

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

---

> API Reference / Branches / Set branch as default

## POST /projects/{project_id}/branches/{branch_id}/set_as_default

Sets the specified branch as the project's default branch.
The default designation is automatically removed from the previous default branch.
For more information, see [Manage branches](https://neon.com/docs/manage/branches/).


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
    "parent_lsn": "0/1964258",
    "parent_timestamp": "2025-01-15T10:30:00Z",
    "name": "my-branch-8",
    "slug": "br-young-forest-a5b6c7d8",
    "current_state": "ready",
    "state_changed_at": "2025-01-15T10:30:00Z",
    "creation_source": "console",
    "primary": true,
    "default": true,
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
  "operations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/set_as_default" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.setDefaultProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon branches set-default <id|name>
```

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

---

> API Reference / Branches / Finalize branch restore from snapshot

## POST /projects/{project_id}/branches/{branch_id}/finalize_restore

Finalize the restore operation for a branch created from a snapshot.
This operation updates the branch so it functions as the original branch it replaced.
This includes:
  - Reassigning any computes from the original branch to the restored branch (this will restart the computes)
  - Renaming the restored branch to the original branch's name
  - Renaming the original branch so it no longer uses the original name

This operation only applies to branches created using the `restoreSnapshot` endpoint with `finalize_restore: false`.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `name` (string, optional)
  Name for the replaced branch. If omitted, a unique name is generated.

### Response (200)

- `operations` (array, optional)
  - `id` (string, required, format: uuid)
    The operation ID
  - `project_id` (string, required)
    The ID of the project this operation ran on.
  - `branch_id` (string, optional)
    The ID of the branch this operation ran on.
  - `endpoint_id` (string, optional)
    The ID of the compute endpoint this operation ran on.
  - `action` (string, required)
    The action performed by the operation
    Possible values: `create_compute`, `create_timeline`, `start_compute`, `suspend_compute`, `apply_config`, `check_availability`, `delete_timeline`, `create_branch`, `import_data`, `tenant_ignore`, `tenant_attach`, `tenant_detach`, `tenant_detach_safekeepers`, `tenant_attach_safekeepers`, `tenant_reattach`, `replace_safekeeper`, `disable_maintenance`, `apply_storage_config`, `prepare_secondary_pageserver`, `switch_pageserver`, `detach_parent_branch`, `timeline_archive`, `timeline_unarchive`, `start_reserved_compute`, `sync_dbs_and_roles_from_compute`, `apply_schema_from_branch`, `timeline_mark_invisible`, `timeline_update_protected_config`, `prewarm_replica`, `promote_replica`, `set_storage_non_dirty`, `swap_binding_id`, `finalize_migration`, `mark_migration_prepared`, `update_catalog`, `epc_sync`
  - `status` (string, required)
    Current lifecycle state of the operation. On `failed`, see `failures_count` and `retry_at` for retry detail.
    Possible values: `scheduling`, `running`, `finished`, `failed`, `error`, `cancelling`, `cancelled`, `skipped`
  - `error` (string, optional)
    Human-readable message describing why the operation failed.
  - `failures_count` (integer, required, format: int32)
    The number of times the operation failed
  - `retry_at` (string, optional, format: date-time)
    A timestamp indicating when the operation was last retried
  - `created_at` (string, required, format: date-time)
    A timestamp indicating when the operation was created
  - `updated_at` (string, required, format: date-time)
    A timestamp indicating when the operation status was last updated
  - `total_duration_ms` (integer, required, format: int32)
    The total duration of the operation in milliseconds

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/finalize_restore" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.finalizeRestoreBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon snapshots finalize <branch_id>
```

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

---

> API Reference / Branches / List branch endpoints

## GET /projects/{project_id}/branches/{branch_id}/endpoints

Retrieves a list of compute endpoints for the specified branch.
Neon permits only one read-write compute endpoint per branch.
A branch can have multiple read-only compute endpoints.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "endpoints": [
    {
      "host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
      "hosts": {
        "read_only_host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
        "read_only_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-5.us-east-2.aws.neon.tech"
      },
      "id": "ep-cool-darkness-a5b6c7d8",
      "slug": "ep-cool-darkness-a5b6c7d8",
      "branch_slug": "br-young-forest-a5b6c7d8",
      "project_slug": "aged-wildflower-123456",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "region_id": "aws-us-east-2",
      "type": "read_only",
      "current_state": "active",
      "group": {
        "size": {
          "min": 1,
          "max": 1
        },
        "allow_readable_secondaries": true,
        "computes": [
          {
            "binding_id": "hx7",
            "current_state": "active",
            "role": "read_only",
            "compute_host": "ep-cool-darkness-a5b6c7d8-hx7.c-5.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-hx7-pooler.c-5.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-15T11:00:00Z",
            "started_at": "2025-01-15T11:00:00Z"
          }
        ]
      },
      "settings": {
        "pg_settings": {
          "idle_in_transaction_session_timeout": "300000",
          "statement_timeout": "60000"
        }
      },
      "pooler_enabled": false,
      "pooler_mode": "transaction",
      "disabled": false,
      "passwordless_access": true,
      "last_active": "2025-01-15T11:30:00Z",
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "started_at": "2025-01-15T11:00:00Z",
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm",
      "compute_release_version": "13903"
    },
    {
      "host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
      "hosts": {
        "read_write_host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
        "read_write_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-5.us-east-2.aws.neon.tech"
      },
      "id": "ep-cool-darkness-a5b6c7d8",
      "slug": "ep-cool-darkness-a5b6c7d8",
      "branch_slug": "br-young-forest-a5b6c7d8",
      "project_slug": "aged-wildflower-123456",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "region_id": "aws-us-east-2",
      "type": "read_write",
      "current_state": "active",
      "group": {
        "size": {
          "min": 1,
          "max": 1
        },
        "allow_readable_secondaries": false,
        "computes": [
          {
            "binding_id": "g8k",
            "current_state": "active",
            "role": "read_write",
            "compute_host": "ep-cool-darkness-a5b6c7d8-g8k.c-5.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-g8k-pooler.c-5.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T12:00:00Z",
            "updated_at": "2025-01-15T12:30:00Z",
            "started_at": "2025-01-15T13:00:00Z"
          }
        ]
      },
      "settings": {
        "pg_settings": {}
      },
      "pooler_enabled": false,
      "pooler_mode": "transaction",
      "disabled": false,
      "passwordless_access": true,
      "last_active": "2025-01-15T13:30:00Z",
      "creation_source": "console",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:30:00Z",
      "started_at": "2025-01-15T13:00:00Z",
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm",
      "compute_release_version": "13903"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/endpoints" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchEndpoints({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### MCP

Tool: `list_branch_computes`

List compute endpoints for a project or branch. Do not use when you need a connection string: use `get_connection_string`, which requires write access and is unavailable in read-only mode.

- `projectId` (string, optional)
  The ID of the project. If not provided, the only available project will be used.
- `branchId` (string, optional)
  The ID of the branch. If provided, endpoints for this specific branch will be listed.

### Console

Console path: Projects → Branches → Computes

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

---

> API Reference / Branches / List databases

## GET /projects/{project_id}/branches/{branch_id}/databases

Retrieves a list of databases for the specified branch.
A branch can have multiple databases.
For related information, see [Manage databases](https://neon.com/docs/manage/databases/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "databases": [
    {
      "id": 1000000,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "dbname",
      "owner_name": "alex",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": 1000001,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb",
      "owner_name": "neondb_owner",
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    },
    {
      "id": 1000002,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-database-2",
      "owner_name": "alex",
      "created_at": "2025-01-15T11:30:00Z",
      "updated_at": "2025-01-15T11:30:00Z"
    },
    {
      "id": 1000003,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-database",
      "owner_name": "alex",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": 1000004,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-database-3",
      "owner_name": "alex",
      "created_at": "2025-01-15T12:30:00Z",
      "updated_at": "2025-01-15T12:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchDatabases({
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

### MCP

Tool: `inspect_database`

<use_case> Reach for this first when asked why a database is slow, large, bloated, or behind. It runs one predefined, read-only Postgres diagnostic against a Neon branch — pick the one that answers the question from the `check` parameter's list, instead of writing catalog SQL by hand. These are the same checks as the `neon inspect db` CLI command. </use_case> <important_notes> Not for: arbitrary SQL (`run_sql`), the slowest queries by average execution time with your own threshold and limit (`list_slow_queries`), the plan of one statement (`explain_sql_statement`), applying an optimization (`prepare_query_tuning`), compute and Neon Function logs (`query_logs`), or listing tables and columns (`get_database_tables`, `describe_table_schema`). Several checks read alike and are not: `long-running-queries` is what is running right now in the inspected database and has been for over five minutes; `stalled-queries` is a compute-wide snapshot of active queries running longer than 30 seconds with parallel-worker grouping, waits, and blockers; `outliers` is cumulative execution time since statistics were last reset; and `calls` is call frequency over that same history. Omit `databaseName` to run a database-scoped check against every database on the branch. The result adds a `database` column. `stalled-queries`, `lfc-hit-rate`, `working-set`, and `replication-slots` are compute-wide: they run once against the first listed database. For `lfc-hit-rate` and `working-set`, cache counters reset when the compute restarts. One failing database fails the whole run. `bloat` is a statistical estimate, not a measurement. When a check needs an extension that is not installed, the tool says so and names the `CREATE EXTENSION` statement. Installing it writes to the user's database — ask before running it. </important_notes>

- `check` (enum, required)
  Which diagnostic to run:
- `projectId` (string, required)
  The ID of the project to inspect
- `branchId` (string, optional)
  An optional ID of the branch. If not provided the default branch is used.
- `databaseName` (string, optional)
- `computeId` (string, optional)
  The ID of the compute/endpoint. If not provided, the read-write compute associated with the branch will be used.
- `limit` (number, optional)
  Maximum number of rows to return from the combined result. Per-database ranking and SQL caps are applied first. The response reports how many rows the check produced and whether they were truncated, so raise this only when `truncated` is true. A few checks are capped in SQL and say so in their description.

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

---

> API Reference / Branches / Retrieve database details

## GET /projects/{project_id}/branches/{branch_id}/databases/{database_name}

Retrieves information about the specified database.
For related information, see [Manage databases](https://neon.com/docs/manage/databases/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `database_name` (string, path, required)
  The database name

### Response (200)

```json
{
  "database": {
    "id": 1000000,
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "dbname",
    "owner_name": "alex",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases/$DATABASE_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchDatabase({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    database_name: process.env.DATABASE_NAME
  }
});
```

### MCP

Tool: `get_connection_string`

Get a PostgreSQL connection string for a Neon database. All parameters are optional; the tool resolves the project, branch, and database automatically if not specified. Requires write access: the connection string carries a privileged role password, so it is unavailable in read-only mode. A read-only caller who needs a DATABASE_URL must copy it from https://console.neon.tech manually.

- `projectId` (string, required)
  The ID of the project. If not provided, the only available project will be used.
- `branchId` (string, optional)
  The ID or name of the branch. If not provided, the default branch will be used.
- `computeId` (string, optional)
  The ID of the compute/endpoint. If not provided, the read-write compute associated with the branch will be used.
- `databaseName` (string, optional)
- `roleName` (string, optional)
  The name of the role to connect with. If not provided, the database owner name will be used.

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

---

> API Reference / Branches / Update database

## PATCH /projects/{project_id}/branches/{branch_id}/databases/{database_name}

Updates the specified database in the branch.
For related information, see [Manage databases](https://neon.com/docs/manage/databases/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `database_name` (string, path, required)
  The database name

### Request body

- `database` (object, required)
  Properties to update on the database.
  - `name` (string, optional)
    Name of the database to update.
    
  - `owner_name` (string, optional)
    The name of the role that owns the database
    

```json
{
  "database": {
    "name": "mydb",
    "owner_name": "sally"
  }
}
```

### Response (200)

```json
{
  "database": {
    "id": 1000000,
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "my-database-5",
    "owner_name": "alex",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "operations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases/$DATABASE_NAME" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"database":{"name":"mydb","owner_name":"sally"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProjectBranchDatabase({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    database_name: process.env.DATABASE_NAME
  },
  body: {
    database: {
      name: "mydb",
      owner_name: "sally"
    }
  }
});
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

---

> API Reference / Branches / Delete database

## DELETE /projects/{project_id}/branches/{branch_id}/databases/{database_name}

Deletes the specified database from the branch.
For related information, see [Manage databases](https://neon.com/docs/manage/databases/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `database_name` (string, path, required)
  The database name

### Response (200)

```json
{
  "database": {
    "id": 1000000,
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "my-database-8",
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
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases/$DATABASE_NAME" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranchDatabase({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    database_name: process.env.DATABASE_NAME
  }
});
```

```bash
# neonctl
neon databases delete <branch_id>
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

---

> API Reference / Branches / Create role

## POST /projects/{project_id}/branches/{branch_id}/roles

Creates a Postgres role in the specified branch.
For related information, see [Manage roles](https://neon.com/docs/manage/roles/).

Connections established to the active compute endpoint will be dropped.
If the compute endpoint is idle, the endpoint becomes active for a short period of time and is suspended afterward.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `role` (object, required)
  Properties of the role to create.
  - `name` (string, required)
    The role name. Cannot exceed 63 bytes in length.
    
  - `no_login` (boolean, optional)
    Whether to create a role that cannot login.
    

```json
{
  "role": {
    "name": "sally"
  }
}
```

### Response (201)

```json
{
  "role": {
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "my-role-2",
    "password": "<password>",
    "protected": false,
    "authentication_method": "password",
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/roles" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":{"name":"sally"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  body: {
    role: {
      name: "sally"
    }
  }
});
```

```bash
# neonctl
neon roles create
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

---

> API Reference / Branches / Retrieve role details

## GET /projects/{project_id}/branches/{branch_id}/roles/{role_name}

Retrieves details about the specified role.
In Neon, the terms "role" and "user" are synonymous.
For related information, see [Manage roles](https://neon.com/docs/manage/roles/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `role_name` (string, path, required)
  The role name

### Response (200)

```json
{
  "role": {
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "alex",
    "protected": false,
    "authentication_method": "password",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/roles/$ROLE_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    role_name: process.env.ROLE_NAME
  }
});
```

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

---

> API Reference / Branches / Delete role

## DELETE /projects/{project_id}/branches/{branch_id}/roles/{role_name}

Deletes the specified Postgres role from the branch.
For related information, see [Manage roles](https://neon.com/docs/manage/roles/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `role_name` (string, path, required)
  The role name

### Response (200)

```json
{
  "role": {
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "my-role-8",
    "protected": false,
    "authentication_method": "password",
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
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/roles/$ROLE_NAME" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranchRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    role_name: process.env.ROLE_NAME
  }
});
```

```bash
# neonctl
neon roles delete <branch_id>
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

---

> API Reference / Branches / Retrieve role password

## GET /projects/{project_id}/branches/{branch_id}/roles/{role_name}/reveal_password

Retrieves the password for the specified Postgres role, if possible.
For related information, see [Manage roles](https://neon.com/docs/manage/roles/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `role_name` (string, path, required)
  The role name

### Response (200)

```json
{
  "password": "<password>"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/roles/$ROLE_NAME/reveal_password" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchRolePassword({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    role_name: process.env.ROLE_NAME
  }
});
```

```bash
# neonctl
neon connection-string [branch] get
```

### Console

Console path: Projects → Branches → Roles & Databases

### Errors

**404**
Role not found
- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

**412**
Storing passwords is disabled
- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

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

---

> API Reference / Branches / Reset role password

## POST /projects/{project_id}/branches/{branch_id}/roles/{role_name}/reset_password

Resets the password for the specified Postgres role.
Returns a new password and operations. The new password is ready to use when the last operation finishes.
The old password remains valid until last operation finishes.
Connections to the compute endpoint are dropped. If idle,
the compute endpoint becomes active for a short period of time.

For related information, see [Manage roles](https://neon.com/docs/manage/roles/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `role_name` (string, path, required)
  The role name

### Response (200)

```json
{
  "role": {
    "branch_id": "br-young-forest-a5b6c7d8",
    "name": "my-role-5",
    "password": "<password>",
    "protected": false,
    "authentication_method": "password",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z"
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
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/roles/$ROLE_NAME/reset_password" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.resetProjectBranchRolePassword({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    role_name: process.env.ROLE_NAME
  }
});
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
