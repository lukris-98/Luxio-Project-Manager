---
operationId: "listProjects"
method: "GET"
path: "/projects"
tag: "projects"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
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
