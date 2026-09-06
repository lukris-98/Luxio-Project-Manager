---
operationId: "recoverProject"
method: "POST"
path: "/projects/{project_id}/recover"
tag: "projects"
stability: "beta"
interfaces: ["api", "sdk", "cli"]
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
