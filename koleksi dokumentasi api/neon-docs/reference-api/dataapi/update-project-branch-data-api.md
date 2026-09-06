---
operationId: "updateProjectBranchDataAPI"
method: "PATCH"
path: "/projects/{project_id}/branches/{branch_id}/data-api/{database_name}"
tag: "dataapi"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Data API / Update Neon Data API

## PATCH /projects/{project_id}/branches/{branch_id}/data-api/{database_name}

Updates the Neon Data API configuration for the specified branch.
You can optionally provide settings to update the Data API configuration.
The schema cache is always refreshed as part of this operation.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `database_name` (string, path, required)
  The database name

### Request body

- `settings` (object, optional)
  Configuration settings for the Neon Data API.
  - `db_aggregates_enabled` (boolean, optional)
    Enable aggregates feature
    Default: `true`
  - `db_anon_role` (string, optional)
    Database role to use for anonymous requests
    Default: `anonymous`
  - `db_extra_search_path` (string, optional)
    Extra schemas to add to the search path
  - `db_max_rows` (integer, optional)
    Hard limit on the number of rows returned in a single Data API response. No limit when unset.
  - `db_schemas` (array, optional)
    List of schemas to expose via the API. Default: ["public"]
  - `jwt_role_claim_key` (string, optional)
    JWT claim key to use for role extraction
    Default: `.role`
  - `jwt_cache_max_lifetime` (integer, optional)
    Maximum lifetime of the Data API's JWT cache, in seconds.
  - `openapi_mode` (string, optional)
    OpenAPI specification mode (ignore-privileges, disabled)
    Default: `disabled`
  - `server_cors_allowed_origins` (string, optional)
    CORS allowed origins
  - `server_timing_enabled` (boolean, optional)
    When enabled, the Data API adds `Server-Timing` headers to each response showing database execution and internal processing time. Default: disabled.

### Response (201)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/data-api/$DATABASE_NAME" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProjectBranchDataApi({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    database_name: process.env.DATABASE_NAME
  }
});
```

```bash
# neonctl
neon data-api update
```

### Console

Console path: Projects → Data API → Settings

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
