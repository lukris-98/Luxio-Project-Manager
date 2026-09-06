# Projects

A Neon project is the top-level container for your Postgres workload. It holds branches, compute endpoints, roles, and databases, plus the Postgres version, region, and project-wide settings. When you create a project, Neon provisions a root branch (`main`), a default compute, a `neondb` database, and a matching role automatically.

Use these endpoints to create, update, delete, and list projects from automation and provisioning scripts.

You can also manage projects from the CLI with [`neon projects`](/docs/cli/projects).

See [Manage projects](/docs/manage/projects) for plan limits, restoration, and ownership transfer.

---

> API Reference / Projects / List projects

## GET /projects

Retrieves a list of projects for the specified organization.
If using a personal API key, include the `org_id` parameter to specify which organization to work with.
If using an org API key, `org_id` is automatically inferred from the key.
For more information, see [Manage organizations using the Neon API](https://neon.com/docs/manage/orgs-api)
and [Manage projects](https://neon.com/docs/manage/projects/).


### Parameters

- `cursor` (string, query, optional)
  Specify the cursor value from the previous response to retrieve the next batch of projects.
- `limit` (integer, query, optional)
  Specify a value from 1 to 400 to limit number of projects in the response.
  Default: `10`
- `search` (string, query, optional)
  Search by project `name` or `id`. You can specify partial `name` or `id` values to filter results.
- `org_id` (string, query, optional)
  Search for projects by `org_id`.
- `timeout` (integer, query, optional)
  Specify an explicit timeout in milliseconds to limit response delay.
  After timing out, the incomplete list of project data fetched so far will be returned.
  Projects still being fetched when the timeout occurred are listed in the "unavailable" attribute of the response.
  If not specified, an implicit implementation defined timeout is chosen with the same behaviour as above
  
- `recoverable` (boolean, query, optional)
  Show only deleted projects within the recovery window.
  
  Default: `false`

### Response (200)

```json
{
  "projects": [
    {
      "id": "silent-forest-303030",
      "platform_id": "aws",
      "region_id": "aws-us-east-2",
      "name": "my-test-project",
      "provisioner": "k8s-neonvm",
      "default_endpoint_settings": {
        "autoscaling_limit_min_cu": 1,
        "autoscaling_limit_max_cu": 1,
        "suspend_timeout_seconds": 0
      },
      "settings": {
        "allowed_ips": {
          "ips": [],
          "protected_branches_only": false
        },
        "enable_logical_replication": false,
        "maintenance_window": {
          "weekdays": [
            2
          ],
          "start_time": "04:00",
          "end_time": "05:00"
        },
        "block_public_connections": false,
        "block_vpc_connections": false,
        "hipaa": false
      },
      "pg_version": 17,
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "branch_logical_size_limit": 16777216,
      "branch_logical_size_limit_bytes": 17592186044416,
      "store_passwords": true,
      "active_time": 0,
      "cpu_used_sec": 0,
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "synthetic_storage_size": 0,
      "quota_reset_at": "2025-01-15T11:30:00Z",
      "owner_id": "org-spring-garden-12345",
      "org_id": "org-spring-garden-12345",
      "history_retention_seconds": 86400
    },
    {
      "id": "gentle-river-202020",
      "platform_id": "aws",
      "region_id": "aws-us-east-2",
      "name": "my-staging-project",
      "provisioner": "k8s-neonvm",
      "default_endpoint_settings": {
        "autoscaling_limit_min_cu": 1,
        "autoscaling_limit_max_cu": 1,
        "suspend_timeout_seconds": 0
      },
      "settings": {
        "allowed_ips": {
          "ips": [],
          "protected_branches_only": false
        },
        "enable_logical_replication": false,
        "maintenance_window": {
          "weekdays": [
            3
          ],
          "start_time": "09:00",
          "end_time": "10:00"
        },
        "block_public_connections": false,
        "block_vpc_connections": false,
        "hipaa": false
      },
      "pg_version": 17,
      "proxy_host": "c-4.us-east-2.aws.neon.tech",
      "branch_logical_size_limit": 16777216,
      "branch_logical_size_limit_bytes": 17592186044416,
      "store_passwords": true,
      "active_time": 0,
      "cpu_used_sec": 0,
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T12:00:00Z",
      "synthetic_storage_size": 0,
      "quota_reset_at": "2025-01-15T11:30:00Z",
      "owner_id": "org-spring-garden-12345",
      "org_id": "org-spring-garden-12345",
      "history_retention_seconds": 86400
    }
  ],
  "pagination": {
    "cursor": "gentle-river-202020"
  },
  "applications": {},
  "integrations": {}
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjects({
  client: neon.client
});
```

```bash
# neonctl
neon projects list
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

Console path: Organization → Projects

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

> API Reference / Projects / Create project

## POST /projects

Creates a Neon project within an organization.
If using a personal API key, include the `org_id` parameter to specify which organization to create the project in.
If using an org API key, `org_id` is automatically inferred from the key.
Plan limits define how many projects you can create.
For more information, see [Manage projects](https://neon.com/docs/manage/projects/).

You can specify a region and Postgres version in the request body.
Neon supports Postgres 14 through 18, with 19 rolling out to enabled regions.
For supported regions and `region_id` values, see [Regions](https://neon.com/docs/introduction/regions/).


### Request body

- `project` (object, required)
  Configuration for the new project, including name, region, and Postgres compute and storage settings.
  - `settings` (object, optional)
    Project-level settings applied at creation.
    - `quota` (object, optional)
      Per-project consumption quotas. If a quota is exceeded, all active computes
      are automatically suspended and cannot be started via API calls or incoming connections.
      
      The exception is `logical_size_bytes`, which is enforced per branch.
      If a branch exceeds its `logical_size_bytes` quota, computes can still be started,
      but write operations will fail—allowing data to be deleted to free up space.
      Computes on other branches are not affected.
      
      Setting `logical_size_bytes` overrides any lower value set by the `neon.max_cluster_size` Postgres setting.
      
      Quotas are enforced using per-project consumption metrics with the same names.
      These metrics reset at the start of each billing period. `logical_size_bytes`
      is also an exception—it reflects the total data stored in a branch and does not reset.
      
      A zero or empty quota value means “unlimited.”
      
      - `active_time_seconds` (integer, optional, format: int64)
        The total amount of wall-clock time allowed to be spent by the project's compute endpoints.
        
      - `compute_time_seconds` (integer, optional, format: int64)
        The total amount of CPU seconds allowed to be spent by the project's compute endpoints.
        
      - `written_data_bytes` (integer, optional, format: int64)
        Total amount of data written to all of a project's branches.
        
      - `data_transfer_bytes` (integer, optional, format: int64)
        Total amount of data transferred from all of a project's branches using the proxy.
        
      - `logical_size_bytes` (integer, optional, format: int64)
        Limit on the logical size of every project's branch.
        
        If a branch exceeds its `logical_size_bytes` quota, computes can still be started,
        but write operations will fail—allowing data to be deleted to free up space.
        Computes on other branches are not affected.
        
        Setting `logical_size_bytes` overrides any lower value set by the `neon.max_cluster_size` Postgres setting.
        
    - `allowed_ips` (object, optional)
      A list of IP addresses that are allowed to connect to the compute endpoint.
      If the list is empty or not set, all IP addresses are allowed.
      If protected_branches_only is true, the list will be applied only to protected branches.
      
      - `ips` (array, optional)
        A list of IP addresses that are allowed to connect to the endpoint.
      - `protected_branches_only` (boolean, optional)
        If true, the list will be applied only to protected branches.
    - `enable_logical_replication` (boolean, optional)
      Sets wal_level=logical for all compute endpoints in this project.
      All active endpoints will be suspended.
      Once enabled, logical replication cannot be disabled.
      
    - `maintenance_window` (object, optional)
      A maintenance window is a time period during which Neon may perform maintenance on the project's infrastructure.
      During this time, the project's compute endpoints may be unavailable and existing connections can be
      interrupted.
      
      - `weekdays` (array, required)
        A list of weekdays when the maintenance window is active.
        Encoded as ints, where 1 - Monday, and 7 - Sunday.
        
      - `start_time` (string, required)
        Start time of the maintenance window, in the format of "HH:MM". Uses UTC.
        
      - `end_time` (string, required)
        End time of the maintenance window, in the format of "HH:MM". Uses UTC.
        
    - `block_public_connections` (boolean, optional)
      When set, connections from the public internet
      are disallowed. This supersedes the AllowedIPs list.
      This parameter is under active development and its semantics may change in the future.
      
    - `block_vpc_connections` (boolean, optional)
      When set, connections using VPC endpoints are disallowed.
      This parameter is under active development and its semantics may change in the future.
      
    - `audit_log_level` (string, optional)
      Audit logging level, set only on HIPAA-enabled organizations (absent otherwise). Values: `base`, `extended`, `full`; HIPAA defaults to `extended`. Cannot be lowered back to `base` once `extended` or `full`.
      Possible values: `base`, `extended`, `full`
    - `hipaa` (boolean, optional)
      Enables HIPAA compliance mode for the project, including audit logging.
    - `preload_libraries` (object, optional)
      The shared libraries to preload into the project's compute instances.
      
      - `use_defaults` (boolean, optional)
        When true, the project's preload libraries include the platform default set in addition to any libraries listed in `enabled_libraries`.
      - `enabled_libraries` (array, optional)
        Names of shared preload libraries to enable for the project.
  - `name` (string, optional)
    The project name. If not specified, the name will be identical to the generated project ID
  - `branch` (object, optional)
    Configuration for the initial branch created with the project.
    - `name` (string, optional)
      The default branch name. If not specified, the default branch name, `main`, will be used.
      
    - `role_name` (string, optional)
      The role name. If not specified, the default role name, `{database_name}_owner`, will be used.
      
    - `database_name` (string, optional)
      The database name. If not specified, the default database name, `neondb`, will be used.
      
    - `annotations` (object, optional)
      Arbitrary key-value metadata to attach to the branch.
      
  - `autoscaling_limit_min_cu` (number, optional, deprecated)
    Deprecated. Use `default_endpoint_settings.autoscaling_limit_min_cu` instead.
    
    The minimum number of Compute Units. The minimum value is `0.25`.
    See [Compute size and Autoscaling configuration](https://neon.com/docs/manage/endpoints#compute-size-and-autoscaling-configuration)
    for more information.
    
  - `autoscaling_limit_max_cu` (number, optional, deprecated)
    Deprecated. Use `default_endpoint_settings.autoscaling_limit_max_cu` instead.
    
    The maximum number of Compute Units. See [Compute size and Autoscaling configuration](https://neon.com/docs/manage/endpoints#compute-size-and-autoscaling-configuration)
    for more information.
    
  - `provisioner` (string, optional)
    Compute provisioner. `k8s-neonvm` (default) supports Autoscaling; `k8s-pod` is fixed-size compute. Also `docker` and `serverless-platform`.
  - `region_id` (string, optional)
    The region identifier. Refer to our [Regions](https://neon.com/docs/introduction/regions) documentation for supported regions. Values are specified in this format: `aws-us-east-1`
    
  - `default_endpoint_settings` (object, optional)
    A collection of settings for a Neon endpoint
    - `pg_settings` (object, optional)
      A raw representation of Postgres settings
    - `pgbouncer_settings` (object, optional, deprecated)
      Deprecated. Use the endpoint-level connection pooler configuration instead. Removal scheduled for June 20, 2026.
      
    - `autoscaling_limit_min_cu` (number, optional)
      Minimum number of Compute Units for this endpoint. At least 0.25 and no greater than `autoscaling_limit_max_cu`.
      
    - `autoscaling_limit_max_cu` (number, optional)
      Default maximum number of Compute Units for endpoints created under this account. At least 0.25.
      
    - `suspend_timeout_seconds` (integer, optional, format: int64)
      Scale-to-zero idle timeout, in seconds, before the compute suspends. `0` uses the plan default; `-1` disables scale-to-zero (never suspends). Minimum is plan-dependent (Scale: 60); maximum 604800 (one week). Free cannot change it; Launch can only enable or disable; Scale can set any value.
  - `pg_version` (integer, optional)
    The major Postgres version number. Supported versions are `14`, `15`, `16`, `17`, and `18`. `19` is rolling out and is accepted only in regions where it is enabled; requesting it elsewhere returns an error.
    Default: `18`
  - `store_passwords` (boolean, optional)
    Whether or not passwords are stored for roles in the Neon project. Storing passwords facilitates access to Neon features that require authorization.
    
  - `history_retention_seconds` (integer, optional, format: int32)
    History window (point-in-time restore range) for all branches, in seconds. `0` disables it. Default 1 day (Free: 6 hours). Maximum depends on plan: Free 6 hours (21600), Launch 7 days (604800), Scale 30 days (2592000).
    
  - `org_id` (string, optional)
    ID of the organization that will own the project. If omitted when using an organization API key, it is inferred from the key.
    

```json
{
  "project": {
    "name": "my-production-db",
    "region_id": "aws-us-east-2",
    "pg_version": 17
  }
}
```

### Response (201)

```json
{
  "project": {
    "data_storage_bytes_hour": 0,
    "data_transfer_bytes": 0,
    "written_data_bytes": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "cpu_used_sec": 0,
    "id": "gentle-river-202020",
    "platform_id": "aws",
    "region_id": "aws-us-east-2",
    "name": "my-staging-project",
    "slug": "gentle-river-202020",
    "provisioner": "k8s-neonvm",
    "default_endpoint_settings": {
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "suspend_timeout_seconds": 0
    },
    "settings": {
      "allowed_ips": {
        "ips": [],
        "protected_branches_only": false
      },
      "enable_logical_replication": false,
      "maintenance_window": {
        "weekdays": [
          3
        ],
        "start_time": "09:00",
        "end_time": "10:00"
      },
      "block_public_connections": false,
      "block_vpc_connections": false,
      "hipaa": false
    },
    "pg_version": 17,
    "proxy_host": "c-4.us-east-2.aws.neon.tech",
    "branch_logical_size_limit": 16777216,
    "branch_logical_size_limit_bytes": 17592186044416,
    "store_passwords": true,
    "creation_source": "console",
    "history_retention_seconds": 86400,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "consumption_period_start": "2025-01-15T11:00:00Z",
    "consumption_period_end": "2025-01-15T11:00:00Z",
    "owner_id": "org-spring-garden-12345",
    "org_id": "org-spring-garden-12345"
  },
  "connection_uris": [
    {
      "connection_uri": "postgresql://[user]:[password]@ep-cool-darkness-a5b6c7d8.us-east-2.aws.neon.tech/dbname?sslmode=require&channel_binding=require",
      "connection_parameters": {
        "database": "neondb",
        "password": "<password>",
        "role": "neondb_owner",
        "host": "ep-cool-darkness-a5b6c7d8.c-4.us-east-2.aws.neon.tech",
        "pooler_host": "ep-cool-darkness-a5b6c7d8-pooler.c-4.us-east-2.aws.neon.tech"
      }
    }
  ],
  "roles": [
    {
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb_owner",
      "password": "<password>",
      "protected": false,
      "authentication_method": "password",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "databases": [
    {
      "id": 1000000,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb",
      "owner_name": "neondb_owner",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "gentle-river-202020",
      "branch_id": "br-young-forest-a5b6c7d8",
      "action": "create_timeline",
      "status": "running",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "gentle-river-202020",
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
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "gentle-river-202020",
    "name": "main",
    "slug": "br-young-forest-a5b6c7d8",
    "current_state": "init",
    "pending_state": "ready",
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
  "endpoints": [
    {
      "host": "ep-cool-darkness-a5b6c7d8.c-4.us-east-2.aws.neon.tech",
      "hosts": {
        "read_write_host": "ep-cool-darkness-a5b6c7d8.c-4.us-east-2.aws.neon.tech",
        "read_write_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-4.us-east-2.aws.neon.tech"
      },
      "id": "ep-cool-darkness-a5b6c7d8",
      "slug": "ep-cool-darkness-a5b6c7d8",
      "branch_slug": "br-young-forest-a5b6c7d8",
      "project_slug": "gentle-river-202020",
      "project_id": "gentle-river-202020",
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
            "binding_id": "dsq",
            "current_state": "init",
            "pending_state": "active",
            "role": "read_write",
            "compute_host": "ep-cool-darkness-a5b6c7d8-dsq.c-4.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-dsq-pooler.c-4.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-15T10:30:00Z"
          }
        ]
      },
      "settings": {},
      "pooler_enabled": false,
      "pooler_mode": "transaction",
      "disabled": false,
      "passwordless_access": true,
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "proxy_host": "c-4.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project":{"name":"my-production-db","region_id":"aws-us-east-2","pg_version":17}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProject({
  client: neon.client,
  body: {
    project: {
      name: "my-production-db",
      region_id: "aws-us-east-2",
      pg_version: 17
    }
  }
});
```

```bash
# neonctl
neon projects create
```

### MCP

Tool: `create_project`

Create a new Neon project with a default database and branch. If someone is trying to create a database, use this tool. Returns a connection string for the new project automatically. Supports optional `org_id` (assign to a specific organization) and `name` parameters.

- `name` (string, optional)
  An optional name of the project to create.
- `org_id` (string, optional)
  Create project in a specific organization.

### Console

Console path: Organization → Projects → New project

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

> API Reference / Projects / List shared projects

## GET /projects/shared

Retrieves a list of projects shared with your Neon account.
For more information, see [Manage projects](https://neon.com/docs/manage/projects/).


### Parameters

- `cursor` (string, query, optional)
  Specify the cursor value from the previous response to get the next batch of projects.
- `limit` (integer, query, optional)
  Specify a value from 1 to 400 to limit number of projects in the response.
  Default: `10`
- `search` (string, query, optional)
  Search query by name or id.
- `timeout` (integer, query, optional)
  Specify an explicit timeout in milliseconds to limit response delay.
  After timing out, the incomplete list of project data fetched so far will be returned.
  Projects still being fetched when the timeout occurred are listed in the "unavailable" attribute of the response.
  If not specified, an implicit implementation defined timeout is chosen with the same behaviour as above
  

### Response (200)

```json
{
  "projects": [
    {
      "id": "quiet-river-000267",
      "platform_id": "aws",
      "region_id": "aws-us-east-1",
      "name": "hello world",
      "provisioner": "k8s-neonvm",
      "default_endpoint_settings": {
        "autoscaling_limit_min_cu": 0.25,
        "autoscaling_limit_max_cu": 5,
        "suspend_timeout_seconds": 600
      },
      "settings": {
        "allowed_ips": {
          "ips": [
            "203.0.113.4",
            "198.51.100.0/24"
          ],
          "protected_branches_only": false
        },
        "enable_logical_replication": true,
        "maintenance_window": {
          "weekdays": [
            1
          ],
          "start_time": "06:00",
          "end_time": "07:00"
        },
        "block_public_connections": false,
        "block_vpc_connections": false,
        "audit_log_level": "extended",
        "hipaa": true
      },
      "pg_version": 17,
      "proxy_host": "c-4.us-east-1.aws.neon.tech",
      "branch_logical_size_limit": 16777216,
      "branch_logical_size_limit_bytes": 17592186044416,
      "store_passwords": true,
      "active_time": 2828,
      "cpu_used_sec": 964,
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "synthetic_storage_size": 38578376,
      "owner_id": "org-quiet-river-000268",
      "compute_last_active_at": "2025-01-15T11:30:00Z",
      "org_id": "org-quiet-river-000268",
      "org_name": "My Org",
      "history_retention_seconds": 43200,
      "hipaa_enabled_at": "2025-01-15T12:00:00Z"
    }
  ],
  "unavailable_project_ids": [],
  "pagination": {
    "cursor": "quiet-river-000267"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/shared" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listSharedProjects({
  client: neon.client
});
```

```bash
# neonctl
neon projects list
```

### MCP

Tool: `list_shared_projects`

List projects shared with the current user for collaboration. Do not use for projects you own (use `list_projects` instead). Supports optional `search` (filter by name or ID) and `limit` (default 10) parameters.

- `cursor` (string, optional)
  Specify the cursor value from the previous response to retrieve the next batch of shared projects.
- `limit` (number, optional, default: 10)
  Specify a value from 1 to 400 to limit number of shared projects in the response.
- `search` (string, optional)
  Search by project name or id. You can specify partial name or id values to filter results.

### Console

Console path: Organization → Projects

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

> API Reference / Projects / Retrieve project details

## GET /projects/{project_id}

Retrieves information about the specified project.
Returned details include the project settings, compute configuration, history retention, owner information, and current usage metrics.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "project": {
    "data_storage_bytes_hour": 0,
    "data_transfer_bytes": 0,
    "written_data_bytes": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "cpu_used_sec": 0,
    "id": "aged-wildflower-123456",
    "platform_id": "aws",
    "region_id": "aws-us-east-2",
    "name": "my-project",
    "slug": "aged-wildflower-123456",
    "provisioner": "k8s-neonvm",
    "default_endpoint_settings": {
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "suspend_timeout_seconds": 0
    },
    "settings": {
      "allowed_ips": {
        "ips": [],
        "protected_branches_only": false
      },
      "enable_logical_replication": false,
      "maintenance_window": {
        "weekdays": [
          6
        ],
        "start_time": "08:00",
        "end_time": "09:00"
      },
      "block_public_connections": false,
      "block_vpc_connections": false,
      "hipaa": false
    },
    "pg_version": 17,
    "proxy_host": "c-5.us-east-2.aws.neon.tech",
    "branch_logical_size_limit": 16777216,
    "branch_logical_size_limit_bytes": 17592186044416,
    "store_passwords": true,
    "creation_source": "console",
    "history_retention_seconds": 86400,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "synthetic_storage_size": 0,
    "consumption_period_start": "2025-01-15T11:30:00Z",
    "consumption_period_end": "2025-01-15T12:00:00Z",
    "owner_id": "org-spring-garden-12345",
    "owner": {
      "email": "jane.doe@example.com",
      "name": "My Org",
      "branches_limit": 5000,
      "subscription_type": "scale_v3"
    },
    "compute_last_active_at": "2025-01-15T12:30:00Z",
    "org_id": "org-spring-garden-12345"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon projects get <project_id>
```

### MCP

Tool: `describe_project`

Get details and configuration of a specific Neon project. Do not use when you need to list all projects (use `list_projects` instead).

- `projectId` (string, required)
  The ID of the project to describe

### Console

Console path: Organization → Projects

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

> API Reference / Projects / Update project

## PATCH /projects/{project_id}

Updates the specified project.
Configurable properties include the project name, default compute settings, history retention period, and IP allowlist.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `project` (object, required)
  - `settings` (object, optional)
    Project-level settings, for example `quota`, `allowed_ips`, `enable_logical_replication`, and `maintenance_window`.
    - `quota` (object, optional)
      Per-project consumption quotas. If a quota is exceeded, all active computes
      are automatically suspended and cannot be started via API calls or incoming connections.
      
      The exception is `logical_size_bytes`, which is enforced per branch.
      If a branch exceeds its `logical_size_bytes` quota, computes can still be started,
      but write operations will fail—allowing data to be deleted to free up space.
      Computes on other branches are not affected.
      
      Setting `logical_size_bytes` overrides any lower value set by the `neon.max_cluster_size` Postgres setting.
      
      Quotas are enforced using per-project consumption metrics with the same names.
      These metrics reset at the start of each billing period. `logical_size_bytes`
      is also an exception—it reflects the total data stored in a branch and does not reset.
      
      A zero or empty quota value means “unlimited.”
      
      - `active_time_seconds` (integer, optional, format: int64)
        The total amount of wall-clock time allowed to be spent by the project's compute endpoints.
        
      - `compute_time_seconds` (integer, optional, format: int64)
        The total amount of CPU seconds allowed to be spent by the project's compute endpoints.
        
      - `written_data_bytes` (integer, optional, format: int64)
        Total amount of data written to all of a project's branches.
        
      - `data_transfer_bytes` (integer, optional, format: int64)
        Total amount of data transferred from all of a project's branches using the proxy.
        
      - `logical_size_bytes` (integer, optional, format: int64)
        Limit on the logical size of every project's branch.
        
        If a branch exceeds its `logical_size_bytes` quota, computes can still be started,
        but write operations will fail—allowing data to be deleted to free up space.
        Computes on other branches are not affected.
        
        Setting `logical_size_bytes` overrides any lower value set by the `neon.max_cluster_size` Postgres setting.
        
    - `allowed_ips` (object, optional)
      A list of IP addresses that are allowed to connect to the compute endpoint.
      If the list is empty or not set, all IP addresses are allowed.
      If protected_branches_only is true, the list will be applied only to protected branches.
      
      - `ips` (array, optional)
        A list of IP addresses that are allowed to connect to the endpoint.
      - `protected_branches_only` (boolean, optional)
        If true, the list will be applied only to protected branches.
    - `enable_logical_replication` (boolean, optional)
      Sets wal_level=logical for all compute endpoints in this project.
      All active endpoints will be suspended.
      Once enabled, logical replication cannot be disabled.
      
    - `maintenance_window` (object, optional)
      A maintenance window is a time period during which Neon may perform maintenance on the project's infrastructure.
      During this time, the project's compute endpoints may be unavailable and existing connections can be
      interrupted.
      
      - `weekdays` (array, required)
        A list of weekdays when the maintenance window is active.
        Encoded as ints, where 1 - Monday, and 7 - Sunday.
        
      - `start_time` (string, required)
        Start time of the maintenance window, in the format of "HH:MM". Uses UTC.
        
      - `end_time` (string, required)
        End time of the maintenance window, in the format of "HH:MM". Uses UTC.
        
    - `block_public_connections` (boolean, optional)
      When set, connections from the public internet
      are disallowed. This supersedes the AllowedIPs list.
      This parameter is under active development and its semantics may change in the future.
      
    - `block_vpc_connections` (boolean, optional)
      When set, connections using VPC endpoints are disallowed.
      This parameter is under active development and its semantics may change in the future.
      
    - `audit_log_level` (string, optional)
      Audit logging level, set only on HIPAA-enabled organizations (absent otherwise). Values: `base`, `extended`, `full`; HIPAA defaults to `extended`. Cannot be lowered back to `base` once `extended` or `full`.
      Possible values: `base`, `extended`, `full`
    - `hipaa` (boolean, optional)
      Enables HIPAA compliance mode for the project, including audit logging.
    - `preload_libraries` (object, optional)
      The shared libraries to preload into the project's compute instances.
      
      - `use_defaults` (boolean, optional)
        When true, the project's preload libraries include the platform default set in addition to any libraries listed in `enabled_libraries`.
      - `enabled_libraries` (array, optional)
        Names of shared preload libraries to enable for the project.
  - `name` (string, optional)
    The project name
  - `default_endpoint_settings` (object, optional)
    A collection of settings for a Neon endpoint
    - `pg_settings` (object, optional)
      A raw representation of Postgres settings
    - `pgbouncer_settings` (object, optional, deprecated)
      Deprecated. Use the endpoint-level connection pooler configuration instead. Removal scheduled for June 20, 2026.
      
    - `autoscaling_limit_min_cu` (number, optional)
      Minimum number of Compute Units for this endpoint. At least 0.25 and no greater than `autoscaling_limit_max_cu`.
      
    - `autoscaling_limit_max_cu` (number, optional)
      Default maximum number of Compute Units for endpoints created under this account. At least 0.25.
      
    - `suspend_timeout_seconds` (integer, optional, format: int64)
      Scale-to-zero idle timeout, in seconds, before the compute suspends. `0` uses the plan default; `-1` disables scale-to-zero (never suspends). Minimum is plan-dependent (Scale: 60); maximum 604800 (one week). Free cannot change it; Launch can only enable or disable; Scale can set any value.
  - `history_retention_seconds` (integer, optional, format: int32)
    History window (point-in-time restore range) for all branches, in seconds. `0` disables it. Default 1 day (Free: 6 hours). Maximum depends on plan: Free 6 hours (21600), Launch 7 days (604800), Scale 30 days (2592000).
    

```json
{
  "project": {
    "name": "my-production-db"
  }
}
```

### Response (200)

```json
{
  "project": {
    "data_storage_bytes_hour": 0,
    "data_transfer_bytes": 0,
    "written_data_bytes": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "cpu_used_sec": 0,
    "id": "misty-meadow-000005",
    "platform_id": "aws",
    "region_id": "aws-us-east-2",
    "name": "my-project-5-updated",
    "slug": "misty-meadow-000005",
    "provisioner": "k8s-neonvm",
    "default_endpoint_settings": {
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "suspend_timeout_seconds": 0
    },
    "settings": {
      "allowed_ips": {
        "ips": [],
        "protected_branches_only": false
      },
      "enable_logical_replication": false,
      "maintenance_window": {
        "weekdays": [
          7
        ],
        "start_time": "09:00",
        "end_time": "10:00"
      },
      "block_public_connections": false,
      "block_vpc_connections": false,
      "hipaa": false
    },
    "pg_version": 17,
    "proxy_host": "c-4.us-east-2.aws.neon.tech",
    "branch_logical_size_limit": 16777216,
    "branch_logical_size_limit_bytes": 17592186044416,
    "store_passwords": true,
    "creation_source": "console",
    "history_retention_seconds": 86400,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "synthetic_storage_size": 0,
    "consumption_period_start": "2025-01-15T11:30:00Z",
    "consumption_period_end": "2025-01-15T11:30:00Z",
    "owner_id": "org-spring-garden-12345"
  },
  "operations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project":{"name":"my-production-db"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  },
  body: {
    project: {
      name: "my-production-db"
    }
  }
});
```

```bash
# neonctl
neon projects update <project_id>
```

### Console

Console path: Organization → Projects

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

> API Reference / Projects / Delete project

## DELETE /projects/{project_id}

Deletes the specified project and all its endpoints, branches, databases, and users.
Deleted projects can be recovered within 7 days using `POST /projects/{project_id}/recover`.
To list recoverable projects, use `GET /projects?recoverable=true`.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "project": {
    "data_storage_bytes_hour": 0,
    "data_transfer_bytes": 0,
    "written_data_bytes": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "cpu_used_sec": 0,
    "id": "misty-meadow-000014",
    "platform_id": "aws",
    "region_id": "aws-us-east-2",
    "name": "my-project-14",
    "slug": "misty-meadow-000014",
    "provisioner": "k8s-neonvm",
    "default_endpoint_settings": {
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "suspend_timeout_seconds": 0
    },
    "settings": {
      "allowed_ips": {
        "ips": [],
        "protected_branches_only": false
      },
      "enable_logical_replication": false,
      "maintenance_window": {
        "weekdays": [
          2
        ],
        "start_time": "07:00",
        "end_time": "08:00"
      },
      "block_public_connections": false,
      "block_vpc_connections": false,
      "hipaa": false
    },
    "pg_version": 17,
    "proxy_host": "c-5.us-east-2.aws.neon.tech",
    "branch_logical_size_limit": 16777216,
    "branch_logical_size_limit_bytes": 17592186044416,
    "store_passwords": true,
    "creation_source": "console",
    "history_retention_seconds": 86400,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "synthetic_storage_size": 0,
    "consumption_period_start": "2025-01-15T11:30:00Z",
    "consumption_period_end": "2025-01-15T11:30:00Z",
    "owner_id": "org-spring-garden-12345",
    "org_id": "org-spring-garden-12345"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon projects delete <project_id>
```

### MCP

Tool: `delete_project`

Delete a Neon project and all its data. NEVER run autonomously; always ask the user first. For removing single branches, use `delete_branch` instead.

- `projectId` (string, required)
  The ID of the project to delete

### Console

Console path: Projects → Settings → Delete

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

> API Reference / Projects / Recover a deleted project

## POST /projects/{project_id}/recover

Recovers a deleted project within the 7-day deletion recovery period.
Restores branches, endpoints, settings, and connection strings.
Some integrations require manual reconfiguration after recovery.
To list recoverable projects, use `GET /projects?recoverable=true`.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "project": {
    "data_storage_bytes_hour": 0,
    "data_transfer_bytes": 0,
    "written_data_bytes": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "cpu_used_sec": 0,
    "id": "misty-meadow-000017",
    "platform_id": "aws",
    "region_id": "aws-us-east-2",
    "name": "my-project-17",
    "slug": "misty-meadow-000017",
    "provisioner": "k8s-neonvm",
    "default_endpoint_settings": {
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "suspend_timeout_seconds": 0
    },
    "settings": {
      "allowed_ips": {
        "ips": [],
        "protected_branches_only": false
      },
      "enable_logical_replication": false,
      "maintenance_window": {
        "weekdays": [
          7
        ],
        "start_time": "09:00",
        "end_time": "10:00"
      },
      "block_public_connections": false,
      "block_vpc_connections": false,
      "hipaa": false
    },
    "pg_version": 17,
    "proxy_host": "c-4.us-east-2.aws.neon.tech",
    "branch_logical_size_limit": 16777216,
    "branch_logical_size_limit_bytes": 17592186044416,
    "store_passwords": true,
    "creation_source": "console",
    "history_retention_seconds": 86400,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "synthetic_storage_size": 0,
    "consumption_period_start": "2025-01-15T11:30:00Z",
    "consumption_period_end": "2025-01-15T11:30:00Z",
    "owner_id": "org-spring-garden-12345"
  },
  "branches": [
    {
      "id": "br-young-forest-a5b6c7d8",
      "project_id": "misty-meadow-000017",
      "name": "main",
      "slug": "br-young-forest-a5b6c7d8",
      "project_slug": "misty-meadow-000017",
      "current_state": "ready",
      "state_changed_at": "2025-01-15T11:00:00Z",
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
      "updated_at": "2025-01-15T12:00:00Z",
      "init_source": "parent-data"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/recover" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.recoverProject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon projects recover <project_id>
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

> API Reference / Projects / List project access

## GET /projects/{project_id}/permissions

Retrieves details about users who have access to the project, including the permission `id`, the granted-to email address, and the date project access was granted.

### Parameters

- `project_id` (string, path, required)

### Response (200)

```json
{
  "project_permissions": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "granted_to_email": "dana.smith@example.com",
      "granted_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/permissions" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectPermissions({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

### Console

Console path: Projects → Settings → Collaborators

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

> API Reference / Projects / Grant project access

## POST /projects/{project_id}/permissions

Grants project access to the account associated with the specified email address.


### Parameters

- `project_id` (string, path, required)

### Request body

- `email` (string, required, format: email)
  Email address of the user to grant project access to.

### Response (200)

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "granted_to_email": "dana.smith@example.com",
  "granted_at": "2025-01-15T10:30:00Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/permissions" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.grantPermissionToProject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

### Console

Console path: Projects → Settings → Collaborators

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

> API Reference / Projects / List org members and their project roles

## GET /projects/{project_id}/members

Lists organization members and their per-project roles for an org-owned project.
Returns 404 when the project is not org-owned, per-project role management is disabled,
or the caller has no access. Callers with VIEWER or EDITOR see members with
effective project access. Callers with ADMIN also see unassigned org members.


### Parameters

- `project_id` (string, path, required)
- `cursor` (string, query, optional)
  A cursor to use in pagination. A cursor defines your place in the data list. Include `response.pagination.next` in subsequent API calls to fetch next page of the list.
- `limit` (integer, query, optional)
  The maximum number of members to return in the response

### Response (200)

- `project_members` (array, optional)
  - `member_id` (string, required, format: uuid)
    The organization member ID.
  - `user_id` (string, required, format: uuid)
    The user ID for the organization member.
  - `email` (string, optional, format: email)
    Email address of the user who has been granted access to the project.
  - `name` (string, optional)
    The user's display name.
  - `org_role` (string, required)
    Organization-level role used by project member role management.
    
    Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
  - `project_role` (string, optional)
    Per-project role. `viewer` maps to `VIEWER`, `editor` maps to `EDITOR`,
    and `admin` maps to `ADMIN`.
    
    Possible values: `viewer`, `editor`, `admin`
  - `org_default_project_permission` (string, optional)
    The caller's effective permission for a project when
    per-project permissions are enabled. `VIEWER` grants read access,
    `EDITOR` adds update access, and `ADMIN` grants full management.
    Omitted for personal projects, flag-off organizations, and non-user
    subjects.
    
    Possible values: `VIEWER`, `EDITOR`, `ADMIN`
  - `explicit_project_permission` (string, optional)
    The caller's effective permission for a project when
    per-project permissions are enabled. `VIEWER` grants read access,
    `EDITOR` adds update access, and `ADMIN` grants full management.
    Omitted for personal projects, flag-off organizations, and non-user
    subjects.
    
    Possible values: `VIEWER`, `EDITOR`, `ADMIN`
  - `effective_project_permission` (string, optional)
    The caller's effective permission for a project when
    per-project permissions are enabled. `VIEWER` grants read access,
    `EDITOR` adds update access, and `ADMIN` grants full management.
    Omitted for personal projects, flag-off organizations, and non-user
    subjects.
    
    Possible values: `VIEWER`, `EDITOR`, `ADMIN`
  - `grant_source` (string, optional)
    How a member's project access is granted.
    
    Possible values: `explicit`, `org_role_default`, `org_admin_override`, `unassigned`
- `pagination` (object, optional)
  To paginate the response, issue an initial request with `limit` value. Then, add the value returned in the response `.pagination.next` attribute into the request under the `cursor` query parameter to the subsequent request to retrieve next page in pagination. The contents on cursor `next` are opaque, clients are not expected to make any assumptions on the format of the data inside the cursor.
  - `next` (string, optional)
    Cursor for the next page of results. Pass it as the `cursor` query parameter on the next request. Absent on the last page.
  - `sort_by` (string, optional)
    Field by which the results were sorted, echoing the request's sort_by parameter.
  - `sort_order` (string, optional)
    Sort order active for this page. Pass back as `sort_order` in the next request to maintain consistent ordering. Valid values are `asc` and `desc`.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/members" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectMembers({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Projects / Set an org member's role on a project

## PUT /projects/{project_id}/members/{member_id}/role

Idempotently sets or updates the explicit project grant of the specified org member.
Self-demotion requires `confirm_self_demotion=true`.


### Parameters

- `project_id` (string, path, required)
- `member_id` (string, path, required)
- `confirm_self_demotion` (boolean, query, optional)

### Request body

- `role` (string, required)
  Per-project role. `viewer` maps to `VIEWER`, `editor` maps to `EDITOR`,
  and `admin` maps to `ADMIN`.
  
  Possible values: `viewer`, `editor`, `admin`

### Response (200)

- `project_id` (string, optional)
- `member_id` (string, optional, format: uuid)
- `user_id` (string, optional, format: uuid)
- `email` (string, optional, format: email)
  Email address of the user who has been granted access to the project.
- `name` (string, optional)
  The user's display name.
- `org_role` (string, optional)
  Organization-level role used by project member role management.
  
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
- `project_role` (string, optional)
  The resulting effective project role after applying org-admin default access, explicit grants, and creator fallback. Null only when the member has no remaining effective project access.
  Possible values: `viewer`, `editor`, `admin`
- `org_default_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `explicit_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `effective_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `credential_rotation_recommended` (boolean, optional)
  Hint that database credentials may need rotation after the role change.
  
- `org_api_key_rotation_recommended` (boolean, optional)
  Hint that project-scoped org API keys created by the target user may need rotation.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/members/$MEMBER_ID/role" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.setProjectMemberRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    member_id: process.env.MEMBER_ID
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

> API Reference / Projects / Remove an org member's role on a project

## DELETE /projects/{project_id}/members/{member_id}/role

Idempotently removes the explicit project grant. The member's organization-role
default project permission still applies. Self-DELETE requires
`confirm_self_lockout=true` when effective manage access would be lost.


### Parameters

- `project_id` (string, path, required)
- `member_id` (string, path, required)
- `confirm_self_lockout` (boolean, query, optional)

### Response (200)

- `project_id` (string, optional)
- `member_id` (string, optional, format: uuid)
- `user_id` (string, optional, format: uuid)
- `email` (string, optional, format: email)
  Email address of the user who has been granted access to the project.
- `name` (string, optional)
  The user's display name.
- `org_role` (string, optional)
  Organization-level role used by project member role management.
  
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
- `project_role` (string, optional)
  The resulting effective project role after applying org-admin default access, explicit grants, and creator fallback. Null only when the member has no remaining effective project access.
  Possible values: `viewer`, `editor`, `admin`
- `org_default_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `explicit_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `effective_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `credential_rotation_recommended` (boolean, optional)
  Hint that database credentials may need rotation after the role change.
  
- `org_api_key_rotation_recommended` (boolean, optional)
  Hint that project-scoped org API keys created by the target user may need rotation.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/members/$MEMBER_ID/role" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.removeProjectMemberRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    member_id: process.env.MEMBER_ID
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

> API Reference / Projects / Revoke project access

## DELETE /projects/{project_id}/permissions/{permission_id}

Revokes project access from the user associated with the specified permission `id`. You can retrieve a user's permission `id` by listing project access.

### Parameters

- `project_id` (string, path, required)
- `permission_id` (string, path, required)

### Response (200)

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "granted_to_email": "dana.smith@example.com",
  "granted_at": "2025-01-15T10:30:00Z",
  "revoked_at": "2025-01-15T10:30:00Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/permissions/$PERMISSION_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.revokePermissionFromProject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    permission_id: process.env.PERMISSION_ID
  }
});
```

### Console

Console path: Projects → Settings → Collaborators

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

> API Reference / Projects / List available shared preload libraries

## GET /projects/{project_id}/available_preload_libraries

Returns the shared preload libraries available for the specified project's Postgres version.
Shared preload libraries are Postgres extensions that require the `shared_preload_libraries`
setting and a compute restart to activate.
Use this list to determine which libraries can be enabled in the project's
`settings.preload_libraries` configuration.


### Parameters

- `project_id` (string, path, required)

### Response (200)

```json
{
  "libraries": [
    {
      "library_name": "timescaledb",
      "description": "Enables scalable inserts and complex queries for time-series data.",
      "is_default": true,
      "is_experimental": false,
      "version": "2.17.1"
    },
    {
      "library_name": "pg_cron",
      "description": "pg_cron is a cron-like job scheduler for PostgreSQL.",
      "is_default": true,
      "is_experimental": false,
      "version": "1.6.7"
    },
    {
      "library_name": "pg_partman_bgw",
      "description": "pg_partman_bgw is a background worker for pg_partman.",
      "is_default": true,
      "is_experimental": false,
      "version": "5.1.0"
    },
    {
      "library_name": "rag_bge_small_en_v15,rag_jina_reranker_v1_tiny_en",
      "description": "Shared libraries for pgrag extensions",
      "is_default": true,
      "is_experimental": true,
      "version": "0.0.0"
    },
    {
      "library_name": "pgx_ulid",
      "description": "pgx_ulid is a PostgreSQL extension for ULID generation.",
      "is_default": false,
      "is_experimental": false,
      "version": "0.2.0"
    },
    {
      "library_name": "pg_mooncake",
      "description": "Columnstore Table in Postgres",
      "is_default": false,
      "is_experimental": false,
      "version": "0.1.1"
    },
    {
      "library_name": "anon",
      "description": "Anonymization & Data Masking for PostgreSQL",
      "is_default": false,
      "is_experimental": false,
      "version": "2.4.1"
    },
    {
      "library_name": "lakebase_vector",
      "description": "High-performance vector index, fully compatible with pgvector.",
      "is_default": false,
      "is_experimental": false,
      "version": "1.0.0-dev"
    },
    {
      "library_name": "lakebase_text",
      "description": "High-performance BM25 full-text search.",
      "is_default": false,
      "is_experimental": false,
      "version": "0.1.0-dev"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/available_preload_libraries" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getAvailablePreloadLibraries({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Projects / Create a project transfer request

## POST /projects/{project_id}/transfer_requests

Creates a transfer request for the specified project. The request expires after a set period.
To accept the request, the recipient calls `PUT /projects/{project_id}/transfer_requests/{request_id}`
or uses the Neon Console claim link.
The optional `ru` parameter redirects the recipient after acceptance.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `ttl_seconds` (integer, optional, format: int64)
  Number of seconds the transfer request stays valid before it expires. Defaults to 86400 (24 hours).
  
  Default: `86400`

### Response (201)

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "project_id": "misty-meadow-000007",
  "created_at": "2025-01-15T10:30:00Z",
  "expires_at": "2025-02-15T10:30:00Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/transfer_requests" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectTransferRequest({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Projects / Accept a project transfer request

## PUT /projects/{project_id}/transfer_requests/{request_id}

Accepts a transfer request for the specified project, transferring it to the specified organization
or user. If org_id is not passed, the project will be transferred to the current user or organization account.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `request_id` (string, path, required)
  The Neon project transfer request ID

### Request body

- `org_id` (string, optional)
  The Neon organization ID to transfer the project to. If not provided, the project will be
  transferred to the current user or organization account.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/transfer_requests/$REQUEST_ID" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.acceptProjectTransferRequest({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    request_id: process.env.REQUEST_ID
  }
});
```

### Console

Console path: Claim

### Errors

**406**
Account doesn't satisfy the plan requirements to own the project
- `reasons` (array, required)
  List of reasons why the target account's plan cannot satisfy the transfer requirements. Each item contains a `code` identifying the constraint and a `message` with a human-readable explanation.
  - `message` (string, required)
    Description of why the plan is not satisfied
  - `code` (string, required)
    A short code identifying the reason

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

> API Reference / Projects / List JWKS URLs

## GET /projects/{project_id}/jwks

Returns the JWKS URLs available for verifying JWTs used as the authentication mechanism for the specified project.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "jwks": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/jwks" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectJwks({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

### Console

Console path: Projects → Settings → Authentication providers

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

> API Reference / Projects / Add JWKS URL

## POST /projects/{project_id}/jwks

Adds a JWKS URL to the specified project for verifying JWTs used as the authentication mechanism.

The URL must be a valid HTTPS URL that returns a JSON Web Key Set.

The `provider_name` field allows you to specify which authentication provider you're using (e.g., Clerk, Auth0, AWS Cognito).

The `branch_id` scopes the JWKS URL to specific branches; if not specified, it applies to all branches.

The `role_names` scopes the URL to specific roles; if not specified, default roles are used (`authenticator`, `authenticated`, `anonymous`).

The `jwt_audience` specifies which `aud` values are accepted in JWTs.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `jwks_url` (string, required)
  URL of the provider's JWKS endpoint used to verify JWTs.
- `provider_name` (string, required)
  The name of the authentication provider (e.g., Clerk, Stytch, Auth0)
- `branch_id` (string, optional)
  The Neon branch ID. Returned as `id` from `GET /projects/{project_id}/branches`.
- `jwt_audience` (string, optional)
  Expected `aud` claim in incoming JWTs. When set, tokens with a different audience are rejected; tokens with no audience are still accepted. Omit to skip audience validation.
- `role_names` (array, optional, deprecated)
  Deprecated. The roles the JWKS should be mapped to. By default, the JWKS is mapped to the `authenticator`, `authenticated`, and `anonymous` roles.
- `skip_role_creation` (boolean, optional)
  Deprecated. Only used with Neon RLS. If true, role creation is skipped.
  Default: `false`

### Response (201)

```json
{
  "jwks": {
    "id": "00000000-0000-0000-0000-000000000000",
    "project_id": "aged-wildflower-123456",
    "branch_id": "br-young-forest-a5b6c7d8",
    "jwks_url": "https://www.googleapis.com/oauth2/v3/certs",
    "provider_name": "Google",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "jwt_audience": "authenticated",
    "role_names": []
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
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-12345678",
      "action": "apply_config",
      "status": "scheduling",
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/jwks" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.addProjectJwks({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

### Console

Console path: Projects → Settings → Authentication providers

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

> API Reference / Projects / Delete JWKS URL

## DELETE /projects/{project_id}/jwks/{jwks_id}

Removes the specified JWKS URL from the project.
JWTs signed by keys from the removed URL can no longer authenticate to the project's endpoints.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `jwks_id` (string, path, required)
  The JWKS ID

### Response (200)

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "project_id": "misty-meadow-000012",
  "jwks_url": "https://www.googleapis.com/oauth2/v3/certs",
  "provider_name": "Google",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "jwt_audience": "authenticated",
  "role_names": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/jwks/$JWKS_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectJwks({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    jwks_id: process.env.JWKS_ID
  }
});
```

### Console

Console path: Projects → Settings → Authentication providers

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

> API Reference / Projects / Retrieve connection URI

## GET /projects/{project_id}/connection_uri

Retrieves a connection URI for the specified database.
The URI uses the standard PostgreSQL connection string format. Set `pooled=true` to include the `-pooler` suffix for a connection pooler URI.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, query, optional)
  The branch ID. Defaults to your project's default `branch_id` if not specified.
- `endpoint_id` (string, query, optional)
  The endpoint ID. Defaults to the read-write `endpoint_id` associated with the `branch_id` if not specified.
- `database_name` (string, query, required)
  The database name
- `role_name` (string, query, required)
  The role name
- `pooled` (boolean, query, optional)
  Adds the `-pooler` option to the connection URI when set to `true`, creating a pooled connection URI.

### Response (200)

```json
{
  "uri": "postgresql://[user]:[password]@ep-cool-darkness-a5b6c7d8.us-east-2.aws.neon.tech/dbname?sslmode=require&channel_binding=require"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/connection_uri?database_name=$DATABASE_NAME&role_name=$ROLE_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getConnectionUri({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  },
  query: {
    database_name: process.env.DATABASE_NAME,
    role_name: process.env.ROLE_NAME
  }
});
```

```bash
# neonctl
neon connection-string [branch]
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

> API Reference / Projects / List VPC endpoint restrictions

## GET /projects/{project_id}/vpc_endpoints

Lists VPC endpoint restrictions for the specified Neon project.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "endpoints": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/vpc_endpoints" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectVpcEndpoints({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon vpc project list --project-id <id>
```

### Console

Console path: Projects → Settings → Networking

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

> API Reference / Projects / Set VPC endpoint restriction

## POST /projects/{project_id}/vpc_endpoints/{vpc_endpoint_id}

Sets or updates a VPC endpoint restriction for a Neon project.
When a VPC endpoint restriction is set, the project only accepts connections
from the specified VPC.
A VPC endpoint can be set as a restriction only after it is assigned to the
parent organization of the Neon project.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `vpc_endpoint_id` (string, path, required)
  The VPC endpoint ID

### Request body

- `label` (string, required)
  Human-readable name for the VPC endpoint assignment, used to identify it within the organization.

### Response (200)

Configured the specified VPC endpoint as a restriction for the specified project.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/vpc_endpoints/$VPC_ENDPOINT_ID" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.assignProjectVpcEndpoint({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    vpc_endpoint_id: process.env.VPC_ENDPOINT_ID
  }
});
```

```bash
# neonctl
neon vpc project restrict <vpc_endpoint_id> --project-id <id>
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

> API Reference / Projects / Delete VPC endpoint restriction

## DELETE /projects/{project_id}/vpc_endpoints/{vpc_endpoint_id}

Removes the specified VPC endpoint restriction from a Neon project.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `vpc_endpoint_id` (string, path, required)
  The VPC endpoint ID

### Response (200)

Removed the VPC endpoint restriction from the specified Neon project

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/vpc_endpoints/$VPC_ENDPOINT_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectVpcEndpoint({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    vpc_endpoint_id: process.env.VPC_ENDPOINT_ID
  }
});
```

```bash
# neonctl
neon vpc project remove <vpc_endpoint_id> --project-id <id>
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
