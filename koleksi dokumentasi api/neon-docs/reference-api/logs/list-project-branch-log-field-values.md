---
operationId: "listProjectBranchLogFieldValues"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/logs/fields/{field_name}/values"
tag: "logs"
stability: "beta"
interfaces: ["api", "sdk", "cli", "mcp"]
---
> API Reference / Logs / List branch log field values

## GET /projects/{project_id}/branches/{branch_id}/logs/fields/{field_name}/values

Lists the distinct values observed for a low-cardinality log field in
the requested time range. Call the log fields endpoint first to learn
which `field_name` values this branch supports; a field that branch has
never emitted is rejected with `unknown_field`.

Give the window either as `since` or as an explicit `start_time`;
supplying both is rejected. If neither is given, the previous six hours
are used. The maximum supported time range is seven days.

**Note**: This endpoint is currently in Private Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `field_name` (string, path, required)
  The log field whose distinct values should be returned. Must be one of
  the names returned by the log fields endpoint for this branch.
  
- `since` (string, query, optional)
  Length of the lookup window, ending at `end_time` or at the current
  time when `end_time` is omitted. Mutually exclusive with
  `start_time`. Defaults to six hours.
  
- `start_time` (string, query, optional)
  Inclusive beginning of the lookup window. Mutually exclusive with
  `since`.
  
- `end_time` (string, query, optional)
  Exclusive end of the lookup window. Defaults to the current time.
- `source` (string, query, optional)
  Only consider records emitted by this Neon service.
- `limit` (integer, query, optional)
  Maximum number of distinct values to return. The response sets
  `is_truncated` when this bound, or the server's own scan cap, cut the
  list short.
  
  Default: `100`

### Response (200)

- `values` (array, optional)
- `is_truncated` (boolean, optional)
  True when more distinct values exist than were returned, because
  either the requested `limit` or the server's own scan cap was
  reached. A caller that filters on a partial list is choosing from an
  arbitrary subset, so narrow `since` or `source` and ask again when
  this is `true`.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/logs/fields/$FIELD_NAME/values" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchLogFieldValues({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    field_name: process.env.FIELD_NAME
  },
  query: {
    since: "1h"
  }
});
```

```bash
# neonctl
neon logs field-values <branch_id>
```

### MCP

Tool: `list_log_field_values`

List the distinct values of a log field (e.g. all service_name or severity_text values seen) within a branch and time window. Use values with the corresponding query_logs structured input when one exists, or with raw logql otherwise. The field must be one of the names list_log_fields reports for the branch; anything else is rejected as an unknown field rather than returning an empty list. `truncated: true` means more distinct values exist than were returned because the endpoint's result limit or server scan cap was reached, so the list is an arbitrary subset — narrow the time window and ask again before filtering on it.

- `projectId` (string, optional)
  The ID of the project. Defaults to your only project if unambiguous.
- `branchId` (string, optional)
  The ID of the branch. Defaults to the project's default branch.
- `field` (string, required)
  The log field (label) whose distinct values to list, e.g. "service_name" or "severity_text". Use list_log_fields to discover valid field names.
- `since` (string, optional)
  Relative lookback window as a duration (e.g. "6h", "24h"). If omitted, the server default lookback (6 hours) applies; the maximum supported window is `7d`.

### Errors

**400**
The lookup could not be served as written. The body is always
`ProjectBranchLogsInvalidQuery` — see `reason` for the exact cause.

- `code` (string, required)
- `message` (string, required)
- `reason` (string, required)
  Machine-readable reason why the request was rejected:
  - `time_range_too_large`: the requested window spans more than seven days.
  - `invalid_time_range`: `end_time` is not after `start_time`.
  - `conflicting_time_range`: both `since` and `start_time` were supplied.
  - `invalid_cursor`: the supplied `cursor` is malformed, expired, or was issued for a
    different query.
  - `unknown_field`: the requested `field_name` is not one of the fields the log fields
    endpoint reports for this branch.
  - `invalid_logql`: the supplied `logql` expression does not parse, or uses a
    construct this endpoint does not accept.
  - `conflicting_filters`: `logql` was supplied alongside one or more structured
    filters. Use one or the other.
  
  Possible values: `time_range_too_large`, `invalid_time_range`, `conflicting_time_range`, `invalid_cursor`, `unknown_field`, `invalid_logql`, `conflicting_filters`

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
