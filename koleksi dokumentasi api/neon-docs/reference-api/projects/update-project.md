---
operationId: "updateProject"
method: "PATCH"
path: "/projects/{project_id}"
tag: "projects"
interfaces: ["api", "sdk", "cli", "console"]
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
