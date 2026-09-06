---
operationId: "getConsumptionHistoryPerProject"
method: "GET"
path: "/consumption_history/projects"
tag: "consumption"
interfaces: ["api", "sdk"]
---
> API Reference / Consumption / Retrieve project consumption metrics (legacy plans)

## GET /consumption_history/projects

Retrieves consumption metrics for Scale, Business, and Enterprise plan projects. History begins at the time of upgrade.
Results are ordered by time in ascending order (oldest to newest).
Issuing a call to this API does not wake a project's compute endpoint.


### Parameters

- `cursor` (string, query, optional)
  Specify the cursor value from the previous response to get the next batch of projects.
- `limit` (integer, query, optional)
  Specify a value from 1 to 100 to limit number of projects in the response.
  Default: `10`
- `project_ids` (array, query, optional)
  Specify a list of project IDs to filter the response.
  If omitted, the response will contain all projects.
  A list of project IDs can be specified as an array of parameter values or as a comma-separated list in a single parameter value.
  - As an array of parameter values: `project_ids=cold-poetry-09157238%20&project_ids=quiet-snow-71788278`
  - As a comma-separated list in a single parameter value: `project_ids=cold-poetry-09157238,quiet-snow-71788278`
  
- `from` (string, query, required)
  Specify the start `date-time` for the consumption period.
  The `date-time` value is rounded according to the specified `granularity`.
  For example, `2024-03-15T15:30:00Z` for `daily` granularity will be rounded to `2024-03-15T00:00:00Z`.
  The specified `date-time` value must respect the specified `granularity`:
  - For `hourly`, consumption metrics are limited to the last 168 hours.
  - For `daily`, consumption metrics are limited to the last 60 days.
  - For `monthly`, consumption metrics are limited to the last year.
  
  The consumption history is available starting from `March 1, 2024, at 00:00:00 UTC`.
  
- `to` (string, query, required)
  Specify the end `date-time` for the consumption period.
  The `date-time` value is rounded according to the specified granularity.
  For example, `2024-03-15T15:30:00Z` for `daily` granularity will be rounded to `2024-03-15T00:00:00Z`.
  The specified `date-time` value must respect the specified `granularity`:
  - For `hourly`, consumption metrics are limited to the last 168 hours.
  - For `daily`, consumption metrics are limited to the last 60 days.
  - For `monthly`, consumption metrics are limited to the last year.
  
- `granularity` (string, query, required)
  Specify the granularity of consumption metrics.
  Hourly, daily, and monthly metrics are available for the last 168 hours, 60 days,
  and 1 year, respectively.
  
- `org_id` (string, query, optional)
  Specify the organization for which the project consumption metrics should be returned.
  If this parameter is not provided, the endpoint will return the metrics for the
  authenticated user's projects.
  
- `include_v1_metrics` (boolean, query, optional)
  The field is deprecated. Please use `metrics` instead.
  If `metrics` is specified, this field is ignored.
  Include metrics utilized in previous pricing models.
  - **data_storage_bytes_hour**: The sum of the maximum observed storage values for each hour,
    which never decreases.
  
- `metrics` (array, query, optional)
  Specify a list of metrics to include in the response.
  If omitted, active_time, compute_time, written_data, synthetic_storage_size are returned.
  Possible values:
  - `active_time_seconds`
  - `compute_time_seconds`
  - `written_data_bytes`
  - `synthetic_storage_size_bytes`
  - `data_storage_bytes_hour`
  - `logical_size_bytes`
  - `logical_size_bytes_hour`
  
  A list of metrics can be specified as an array of parameter values or as a comma-separated list in a single parameter value.
  - As an array of parameter values: `metrics=cpu_seconds&metrics=ram_bytes`
  - As a comma-separated list in a single parameter value: `metrics=cpu_seconds,ram_bytes`
  

### Response (200)

```json
{
  "projects": [
    {
      "project_id": "quiet-river-000270",
      "periods": [
        {
          "period_id": "00000000-0000-0000-0000-000000000000",
          "period_plan": "scale",
          "period_start": "2025-01-15T10:30:00Z",
          "period_end": "2025-01-15T11:00:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T11:30:00Z",
              "timeframe_end": "2025-01-15T11:00:00Z",
              "active_time_seconds": 72,
              "compute_time_seconds": 72,
              "written_data_bytes": 0,
              "synthetic_storage_size_bytes": 0
            }
          ]
        }
      ]
    },
    {
      "project_id": "quiet-river-000271",
      "periods": [
        {
          "period_id": "00000000-0000-0000-0000-000000000000",
          "period_plan": "scale",
          "period_start": "2025-01-15T10:30:00Z",
          "period_end": "2025-01-15T11:00:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T11:30:00Z",
              "timeframe_end": "2025-01-15T11:00:00Z",
              "active_time_seconds": 84,
              "compute_time_seconds": 84,
              "written_data_bytes": 0,
              "synthetic_storage_size_bytes": 0
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
          "period_end": "2025-01-15T11:00:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T11:30:00Z",
              "timeframe_end": "2025-01-15T11:00:00Z",
              "active_time_seconds": 84,
              "compute_time_seconds": 84,
              "written_data_bytes": 0,
              "synthetic_storage_size_bytes": 0
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
curl "https://console.neon.tech/api/v2/consumption_history/projects?from=$FROM&to=$TO&granularity=$GRANULARITY" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getConsumptionHistoryPerProject({
  client: neon.client,
  query: {
    from: process.env.FROM,
    to: process.env.TO,
    granularity: process.env.GRANULARITY
  }
});
```

### Errors

**403**
This endpoint is not available. It is only supported with Scale, Business, and Enterprise plan accounts.
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
The specified `date-time` range is outside the boundaries of the specified `granularity`.
Adjust your `from` and `to` values or select a different `granularity`.

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
