---
operationId: "createProject"
method: "POST"
path: "/projects"
tag: "projects"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
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
