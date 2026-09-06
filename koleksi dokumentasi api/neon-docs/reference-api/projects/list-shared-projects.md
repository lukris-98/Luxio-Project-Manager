---
operationId: "listSharedProjects"
method: "GET"
path: "/projects/shared"
tag: "projects"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
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
