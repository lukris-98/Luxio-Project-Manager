---
operationId: "queryProjectBranchLogs"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/logs/query"
tag: "logs"
stability: "beta"
interfaces: ["api", "sdk", "cli", "mcp"]
---
> API Reference / Logs / Query branch logs

## POST /projects/{project_id}/branches/{branch_id}/logs/query

Returns logs emitted by services running on the specified branch,
ordered by timestamp according to `sort_order`.

All supplied filters are combined with `AND`: a record is returned only
when it matches every filter. `minimum_severity` and `severity_text` are
independent filters, so setting both requires a record to clear the
severity floor *and* match the exact severity text.

Supply `logql` instead of the structured filters to run a raw LogQL
expression. Combining it with any structured filter is rejected rather
than silently ignored; `limit`, `sort_order`, and the time window still
apply, because those bound the query rather than form part of the
expression.

Give the window either as `since` — a duration ending at `end_time`, or
at the current time when `end_time` is omitted — or as an explicit
`start_time`. Supplying both is rejected.

A single response holds at most 1,000 records. When `is_truncated` is
`true`, pass the returned `next_cursor` back as `cursor` to fetch the
next page, repeating the time range and every filter unchanged.

If no time range is supplied, the query covers the previous hour. The
maximum supported time range is seven days. `end_time` is exclusive.

**Note**: This endpoint is currently in Private Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `since` (string, optional)
  A length of time as a count and a unit, for example `30m`, `6h`, or
  `7d`. Valid units are `ms`, `s`, `m`, `h`, and `d`.
  
- `start_time` (string, optional, format: date-time)
  Inclusive beginning of the query window. Mutually exclusive with
  `since`. Defaults to one hour before `end_time`, or one hour before
  the current time when both bounds are omitted.
  
- `end_time` (string, optional, format: date-time)
  Exclusive end of the query window. Defaults to the current time.
- `limit` (integer, optional)
  Maximum number of log records to return per page.
  Default: `100`
- `cursor` (string, optional)
  Opaque pagination cursor returned as `next_cursor` by a previous
  call. Resume the query after the last record of the previous page,
  repeating the time range and every filter unchanged.
  
- `sort_order` (string, optional)
  Order matching records by timestamp. `desc`, the default, returns
  the newest records first.
  
  Possible values: `asc`, `desc`
  Default: `desc`
- `source` (string, optional)
  The Neon service that emitted the log record.
  Possible values: `function`, `storage`, `pg_endpoint`
- `service_name` (string, optional)
  Match the OpenTelemetry `service.name` resource attribute exactly.
- `scope_name` (string, optional)
  Match the OpenTelemetry instrumentation scope name exactly.
- `minimum_severity` (string, optional)
  An OpenTelemetry severity level. A minimum severity includes every
  higher level in this order: `trace`, `debug`, `info`, `warn`, `error`,
  `fatal`.
  
  Possible values: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- `severity_text` (string, optional)
  Match the OpenTelemetry severity text exactly.
- `body_contains` (string, optional)
  Match records whose rendered `message` contains this case-sensitive
  substring.
  
  Records with a structured body are matched against their JSON
  rendering, so the substring meets JSON syntax rather than prose: a
  bare key name such as `operation` matches every record carrying that
  key, and `http_status: 200` matches none, because the rendering
  contains `"http_status":200` with no space.
  
- `trace_id` (string, optional)
  Match records associated with this OpenTelemetry trace ID. W3C Trace
  Context defines a trace ID as 32 lowercase hex digits, and that is
  what is stored, so an uppercase value is rejected rather than
  silently matching nothing.
  
- `logql` (string, optional)
  Escape hatch for selections the structured filters cannot express: a
  raw LogQL expression, evaluated against this branch's log stream.
  
  Only stream selectors and line filters are accepted — no
  aggregations and no parser stages. Supplying this alongside any
  structured filter is rejected with `conflicting_filters` rather than
  silently ignoring one of them. `limit`, `sort_order`, and the time
  window still apply.
  
  This field passes the underlying query language through to the
  caller, so unlike the rest of this contract it may change as that
  backend changes. Prefer the structured filters where they suffice.
  

### Response (200)

- `logs` (array, optional)
  - `timestamp` (string, required, format: date-time)
    The OpenTelemetry record timestamp in UTC.
  - `message` (string, required)
    The OpenTelemetry log body rendered as text. A body that is already a
    string is returned verbatim. Any other OpenTelemetry `AnyValue` body
    — notably the structured key/value body that `storage` records always
    carry — is rendered as compact JSON with its keys sorted
    alphabetically, for example
    `{"bytes":1024,"operation":"GET","object_key":"a/b.png"}`.
    
  - `source` (string, optional)
    The Neon service that emitted the log record.
    Possible values: `function`, `storage`, `pg_endpoint`
  - `entity_id` (string, optional)
    The Neon identifier of the service instance that emitted the record.
  - `service_name` (string, optional)
    The OpenTelemetry `service.name` resource attribute.
  - `scope_name` (string, optional)
    The OpenTelemetry instrumentation scope name.
  - `severity_number` (integer, optional)
    The numeric OpenTelemetry severity.
  - `severity_text` (string, optional)
    The original OpenTelemetry severity text.
  - `trace_id` (string, optional)
    The OpenTelemetry trace ID, when the record belongs to a trace.
  - `span_id` (string, optional)
    The OpenTelemetry span ID, when the record belongs to a span.
  - `attributes` (object, required)
    Customer-defined OpenTelemetry log and resource attributes.
- `next_cursor` (string, optional)
  Pagination cursor to pass as `cursor` on the next request. Empty
  when the response is not truncated.
  
- `is_truncated` (boolean, optional)
  True when more records matched than were returned.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/logs/query" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.queryProjectBranchLogs({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon logs query
```

### MCP

Tool: `query_logs`

<use_case> Query logs emitted by your Neon serverless functions (and other services like storage). Logs are OpenTelemetry-based; this tool exposes them through structured filters so you don't have to write a query language. Use this tool when the user wants to: - See recent logs / errors for a function or service - Investigate a failure ("why did my function error in the last hour?") - Correlate logs to a distributed trace via trace_id </use_case> <workflow> 1. For structured queries, pick the source (defaults to "function") and optionally narrow by serviceName, minSeverity, or bodyContains. For a raw query, supply `logql` and omit structured filters. 2. Set a time window: `since` (relative, e.g. "1h" — default, optionally ending at endTime) OR startTime/endTime (absolute RFC3339). 3. Use list_log_fields / list_log_field_values first if you need to discover valid service names or severities. </workflow> <important_notes> - - Defaults to the project's default branch and the last 1 hour if unspecified. - Results are newest-first and capped by `limit` (default 100); `truncated: true` means more records matched than were returned — narrow the filters or time range. - `minSeverity` follows OTel ordering (trace < debug < info < warn < error < fatal), so "error" also returns FATAL. - The returned preferred `logql` field and legacy `query` field contain the LogQL these filters stand for. Always pass `logql` back to refine it by hand. - Advanced: pass raw `logql` instead of the structured filters. Only stream selectors `{label="v"}` and line filters (|= |~ != !~) are supported — no aggregations or parsers. Combining `logql` with structured filters is rejected. - `query` remains available as a legacy input alias for `logql` and preserves its previous override behavior: when supplied, structured filters are ignored. Do not supply both raw fields. </important_notes>

- `projectId` (string, optional)
  The ID of the project whose logs to query. If omitted and you have exactly one project, that project is used.
- `branchId` (string, optional)
  The ID of the branch whose logs to query. Defaults to the project's default branch.
- `source` (enum, optional)
  Which service produced the logs. "function" (serverless functions) is the default; "storage" and "pg_endpoint" are also available.
- `serviceName` (string, optional)
  Filter to a specific OTel service name (service.name).
- `minSeverity` (enum, optional)
  Return only logs at this OTel severity level or above (trace < debug < info < warn < error < fatal). E.g. "error" returns ERROR and FATAL.
- `severityText` (string, optional)
  Filter to an exact severity text (e.g. "ERROR"). Takes precedence over minSeverity.
- `bodyContains` (string, optional)
  Return only logs whose rendered message contains this case-sensitive substring. Structured messages use compact JSON, so match JSON syntax such as `"http_status":200`, not prose such as `http_status: 200`.
- `traceId` (string, optional)
  Correlate to a distributed trace: return only logs with this trace_id.
- `since` (string, optional)
  Relative lookback window ending at `endTime`, or now when omitted, as a duration (e.g. "30m", "1h", "24h"). Defaults to the last hour; the maximum supported window is `7d`. Ignored when startTime is set.
- `startTime` (string, optional)
  Absolute start of the window, RFC3339 (e.g. "2026-07-16T09:00:00Z"). Overrides `since`; the startTime/endTime window must not span more than seven days.
- `endTime` (string, optional)
  Absolute end of the window, RFC3339. Ends either a relative `since` window or an absolute `startTime` window; defaults to now.
- `limit` (number, optional, default: 100)
  Maximum number of log lines to return (1-1000, default 100). Large results are truncated server-side.
- `logql` (string, optional)
  Advanced: a raw LogQL expression to run instead of the structured filters above (e.g. `{entity_type="function"} |~ "(?i)timeout"`). Only stream selectors and line filters are supported — no aggregations or parser stages. Do not combine it with structured filters.
- `query` (string, optional)
  Legacy compatibility alias for `logql`. Preserves the previous behavior of overriding any structured filters. Do not supply both raw fields.

### Errors

**400**
The query could not be served as written. The body is always
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
