# Consumption

The Consumption API returns usage metrics (compute hours, storage, and data transfer) for your account, organization, or individual projects.

## Scope

Metrics are available at three levels:

- **Account**: usage across all projects you own.
- **Organization**: usage across an organization's projects. See [Organization consumption](/docs/manage/orgs-api-consumption).
- **Project**: per-project metrics on usage-based plans.

> **Note:** Two sets of consumption endpoints exist. `GET /consumption_history/v2/projects` returns usage-based billing metrics (Launch, Scale, Agent, Enterprise plans). `GET /consumption_history/projects` covers legacy plan metrics. See [Query consumption metrics](/docs/guides/consumption-metrics) for endpoint details and when to use each.

To reduce usage, see [Cost optimization](/docs/introduction/cost-optimization) and [Reduce network transfer costs](/docs/introduction/network-transfer).

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

---

> API Reference / Consumption / Retrieve branch consumption metrics

## GET /consumption_history/v2/branches

Returns consumption metrics for each branch across one or more projects listed in
`project_ids` (1 to 100 projects). Available for accounts on paid usage-based Launch, Scale,
Agent, and Enterprise plans.

History starts when the account first ingests branch-level consumption data.

The `metrics` query parameter is required. Only these six values are supported on this
endpoint:
`compute_unit_seconds`, `root_branch_bytes_month`, `child_branch_bytes_month`,
`instant_restore_bytes_month`, `public_network_transfer_bytes`, `private_network_transfer_bytes`.

This endpoint does not support `extra_branches_month` or `snapshot_storage_bytes_month`.
Use `GET /consumption_history/v2/projects` for those.

Consumption metrics within each branch are returned in ascending time order (oldest first).
This request does not wake project computes.


### Parameters

- `cursor` (string, query, optional)
  Cursor from the previous response (`pagination.cursor`). Pass it to fetch the next page
  of branches. Pages are ordered by project ID, then branch ID.
  
- `limit` (integer, query, optional)
  Maximum number of branches per page. Allowed range: 1 to 1000. Default: 100.
  
  Default: `100`
- `project_ids` (array, query, required)
  Project IDs to include (required, 1 to 100). Returns metrics for branches in these projects.
  
  Pass multiple IDs as repeated query parameters or a comma-separated list:
  - `project_ids=cold-poetry-09157238&project_ids=quiet-snow-71788278`
  - `project_ids=cold-poetry-09157238,quiet-snow-71788278`
  
- `branch_ids` (array, query, optional)
  Optional branch IDs to filter the response (up to 100). If omitted, all branches in the
  listed projects are included.
  
  Pass multiple IDs as repeated query parameters or a comma-separated list:
  - `branch_ids=br-aged-salad-637688&branch_ids=br-sweet-breeze-497520`
  - `branch_ids=br-aged-salad-637688,br-sweet-breeze-497520`
  
- `from` (string, query, required)
  Specify the start `date-time` for the consumption period.
  The `date-time` value is rounded according to the specified `granularity`.
  For example, `2024-03-15T15:30:00Z` for `daily` granularity will be rounded to `2024-03-15T00:00:00Z`.
  The specified `date-time` value must respect the specified `granularity`:
  - For `hourly`, consumption metrics are limited to the last 168 hours.
  - For `daily`, consumption metrics are limited to the last 60 days.
  - For `monthly`, consumption metrics are limited to the last year.
  
  Branch-level metrics are returned from when the account first ingests branch-level
  consumption data. Periods before that time contain no branch metrics.
  
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
  Required. List the metrics to return. Only these values are supported:
  - `compute_unit_seconds`
  - `root_branch_bytes_month`
  - `child_branch_bytes_month`
  - `instant_restore_bytes_month`
  - `public_network_transfer_bytes`
  - `private_network_transfer_bytes`
  
  Not supported on this endpoint: `extra_branches_month`, `snapshot_storage_bytes_month`.
  Use `GET /consumption_history/v2/projects` for those.
  
  Pass multiple values as repeated query parameters or a comma-separated list:
  - `metrics=compute_unit_seconds&metrics=public_network_transfer_bytes`
  - `metrics=compute_unit_seconds,public_network_transfer_bytes`
  

### Response (200)

```json
{
  "branches": [
    {
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "periods": [
        {
          "period_id": "00000000-0000-0000-0000-000000000000",
          "period_start": "2025-01-15T10:30:00Z",
          "period_end": "2025-02-15T10:30:00Z",
          "consumption": [
            {
              "timeframe_start": "2025-01-15T10:30:00Z",
              "timeframe_end": "2025-01-16T10:30:00Z",
              "metrics": [
                {
                  "metric_name": "compute_unit_seconds",
                  "value": 21600
                }
              ]
            },
            {
              "timeframe_start": "2025-01-16T10:30:00Z",
              "timeframe_end": "2025-01-17T10:30:00Z",
              "metrics": [
                {
                  "metric_name": "compute_unit_seconds",
                  "value": 20700
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/consumption_history/v2/branches?project_ids=$PROJECT_IDS&from=$FROM&to=$TO&granularity=$GRANULARITY&org_id=$ORG_ID&metrics=$METRICS" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getConsumptionHistoryPerBranchV2({
  client: neon.client,
  query: {
    project_ids: process.env.PROJECT_IDS,
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
Not available for this account. Branch consumption history requires a paid usage-based
Launch, Scale, Agent, or Enterprise plan.

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
