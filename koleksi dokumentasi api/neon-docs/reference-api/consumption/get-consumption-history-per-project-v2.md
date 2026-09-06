---
operationId: "getConsumptionHistoryPerProjectV2"
method: "GET"
path: "/consumption_history/v2/projects"
tag: "consumption"
interfaces: ["api", "sdk"]
---
> API Reference / Consumption / Retrieve project consumption metrics

## GET /consumption_history/v2/projects

Returns consumption metrics for up to `limit` projects per page. If `project_ids` is omitted,
projects in the organization are included across pages (use `cursor`). If `project_ids` is
provided, the response is limited to those projects (up to 100). Available for accounts on
Launch, Scale, Agent, Business, and Enterprise plans.

History starts when the account upgrades to an eligible plan.

The `metrics` query parameter is required. Supported values:
`compute_unit_seconds`, `root_branch_bytes_month`, `child_branch_bytes_month`,
`instant_restore_bytes_month`, `public_network_transfer_bytes`, `private_network_transfer_bytes`,
`extra_branches_month`, `snapshot_storage_bytes_month`.

Consumption metrics within each project are returned in ascending time order (oldest first).
This request does not wake project computes.


### Parameters

- `cursor` (string, query, optional)
  Cursor from the previous response (`pagination.cursor`). Pass it to fetch the next page
  of projects. Pages are ordered by project creation order (newest first).
  
- `limit` (integer, query, optional)
  Maximum number of projects per page. Allowed range: 1 to 100. Default: 10.
  
  Default: `10`
- `project_ids` (array, query, optional)
  Optional project IDs to filter the response (up to 100). If omitted, projects in the
  organization are included across pages (use `cursor` and `limit`).
  
  Pass multiple IDs as repeated query parameters or a comma-separated list:
  - `project_ids=cold-poetry-09157238&project_ids=quiet-snow-71788278`
  - `project_ids=cold-poetry-09157238,quiet-snow-71788278`
  
- `from` (string, query, required)
  Specify the start `date-time` for the consumption period.
  The `date-time` value is rounded according to the specified `granularity`.
  For example, `2024-03-15T15:30:00Z` for `daily` granularity will be rounded to `2024-03-15T00:00:00Z`.
  The specified `date-time` value must respect the specified `granularity`:
  - For `hourly`, consumption metrics are limited to the last 168 hours.
  - For `daily`, consumption metrics are limited to the last 60 days.
  - For `monthly`, consumption metrics are limited to the last year.
  
  The earliest allowed `from` value is `March 1, 2024, at 00:00:00 UTC`.
  Metrics are returned from when the account upgraded to an eligible plan, which may be
  later than that date.
  
- `to` (string, query, required)
  Specify the end `date-time` for the consumption period.
  The `date-time` value is rounded according to the specified `granularity`.
  For example, `2024-03-15T15:30:00Z` for `daily` granularity will be rounded to `2024-03-15T00:00:00Z`.
  The specified `date-time` value must respect the specified `granularity`:
  - For `hourly`, consumption metrics are limited to the last 168 hours.
  - For `daily`, consumption metrics are limited to the last 60 days.
  - For `monthly`, consumption metrics are limited to the last year.
  
- `granularity` (string, query, required)
  Specify the granularity of consumption metrics.
  Hourly, daily, and monthly metrics are available for the last 168 hours, 60 days,
  and 1 year, respectively.
  
- `org_id` (string, query, required)
  Organization ID. Metrics are returned for projects in this organization.
  
- `metrics` (array, query, required)
  Required. List the metrics to return. Supported values:
  - `compute_unit_seconds`
  - `root_branch_bytes_month`
  - `child_branch_bytes_month`
  - `instant_restore_bytes_month`
  - `public_network_transfer_bytes`
  - `private_network_transfer_bytes`
  - `extra_branches_month`
  - `snapshot_storage_bytes_month`
  
  Pass multiple values as repeated query parameters or a comma-separated list:
  - `metrics=compute_unit_seconds&metrics=extra_branches_month`
  - `metrics=compute_unit_seconds,extra_branches_month`
  

### Response (200)

```json
{
  "projects": [
    {
      "project_id": "quiet-river-789012",
      "periods": [
        {
          "period_id": "00000000-0000-0000-0000-000000000000",
          "period_plan": "scale",
          "period_start": "2025-01-15T10:30:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T10:30:00Z",
              "timeframe_end": "2025-01-16T10:30:00Z",
              "active_time_seconds": 86400,
              "compute_time_seconds": 21600,
              "written_data_bytes": 4194304,
              "synthetic_storage_size_bytes": 1782579200
            },
            {
              "timeframe_start": "2025-01-16T10:30:00Z",
              "timeframe_end": "2025-01-17T10:30:00Z",
              "active_time_seconds": 82800,
              "compute_time_seconds": 20700,
              "written_data_bytes": 3145728,
              "synthetic_storage_size_bytes": 1810427904
            }
          ]
        }
      ]
    },
    {
      "project_id": "misty-stream-987654",
      "periods": [
        {
          "period_id": "00000000-0000-0000-0000-000000000000",
          "period_plan": "scale",
          "period_start": "2025-01-15T10:30:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T10:30:00Z",
              "timeframe_end": "2025-01-16T10:30:00Z",
              "active_time_seconds": 86400,
              "compute_time_seconds": 21600,
              "written_data_bytes": 4194304,
              "synthetic_storage_size_bytes": 1782579200
            },
            {
              "timeframe_start": "2025-01-16T10:30:00Z",
              "timeframe_end": "2025-01-17T10:30:00Z",
              "active_time_seconds": 82800,
              "compute_time_seconds": 20700,
              "written_data_bytes": 3145728,
              "synthetic_storage_size_bytes": 1810427904
            }
          ]
        }
      ]
    },
    {
      "project_id": "quiet-river-000272",
      "periods": [
        {
          "period_id": "00000000-0000-0000-0000-000000000000",
          "period_plan": "scale",
          "period_start": "2025-01-15T10:30:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T10:30:00Z",
              "timeframe_end": "2025-01-16T10:30:00Z",
              "active_time_seconds": 86400,
              "compute_time_seconds": 21600,
              "written_data_bytes": 4194304,
              "synthetic_storage_size_bytes": 1782579200
            },
            {
              "timeframe_start": "2025-01-16T10:30:00Z",
              "timeframe_end": "2025-01-17T10:30:00Z",
              "active_time_seconds": 82800,
              "compute_time_seconds": 20700,
              "written_data_bytes": 3145728,
              "synthetic_storage_size_bytes": 1810427904
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "cursor": "quiet-river-000270"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/consumption_history/v2/projects?from=$FROM&to=$TO&granularity=$GRANULARITY&org_id=$ORG_ID&metrics=$METRICS" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getConsumptionHistoryPerProjectV2({
  client: neon.client,
  query: {
    from: process.env.FROM,
    to: process.env.TO,
    granularity: process.env.GRANULARITY,
    org_id: process.env.ORG_ID,
    metrics: process.env.METRICS
  }
});
```

### Errors

**403**
Not available for this account. Project consumption history requires a Launch, Scale,
Agent, Business, or Enterprise plan.

- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

**404**
Account is not a member of the organization specified by `org_id`.
- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

**406**
The `from` and `to` range is not valid for the selected `granularity`. Adjust the range or
choose a different granularity.

- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

**429**
Too many requests
- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

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
