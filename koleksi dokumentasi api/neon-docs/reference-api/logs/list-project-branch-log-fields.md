---
operationId: "listProjectBranchLogFields"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/logs/fields"
tag: "logs"
stability: "beta"
interfaces: ["api", "sdk", "cli", "mcp"]
---
> API Reference / Logs / List branch log fields

## GET /projects/{project_id}/branches/{branch_id}/logs/fields

Lists the low-cardinality log fields observed on this branch whose
distinct values can be discovered with the log field-values endpoint.

The set is computed per branch and grows as new fields are observed, so
treat it as data rather than a fixed list: discover a field here, then
pass it as `field_name` to the field-values endpoint.

**Note**: This endpoint is currently in Private Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Response (200)

```json
{
  "fields": [
    "service_name",
    "severity_text",
    "scope_name",
    "entity_type"
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/logs/fields" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchLogFields({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon logs fields
```

### MCP

Tool: `list_log_fields`

List the log fields whose values list_log_field_values can enumerate for a branch. The endpoint currently returns `service_name`, `severity_text`, `scope_name`, and `entity_type`. Call this tool instead of hardcoding that set so clients remain compatible if the endpoint adds fields. Fields without a structured query_logs input can be filtered through raw logql.

- `projectId` (string, optional)
  The ID of the project. Defaults to your only project if unambiguous.
- `branchId` (string, optional)
  The ID of the branch. Defaults to the project's default branch.

### Errors

**404**
Logs are not available for this branch, or the project/branch was
not found. The body is always `ProjectBranchLogsNotAvailable` — see
`reason` for the exact cause.

- `code` (string, required)
- `message` (string, required)
- `reason` (string, required)
  Machine-readable reason why logs cannot be read:
  - `branch_not_found`: the project or branch does not exist, or the caller does not
    have access to it.
  - `telemetry_not_enabled`: the branch exists but is not collecting telemetry, so it
    has no logs to serve.
  
  Possible values: `branch_not_found`, `telemetry_not_enabled`

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
