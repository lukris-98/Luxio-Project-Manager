---
operationId: "getProject"
method: "GET"
path: "/projects/{project_id}"
tag: "projects"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
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
