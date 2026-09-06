# Operations

Operations represent background jobs the Neon Control Plane runs to fulfill API requests: creating branches, starting computes, restoring snapshots, and provisioning databases. Some operations are system-initiated, such as suspending idle computes or running periodic availability checks.

Status values: `scheduling`, `running`, `finished`, `failed`, `cancelling`, `cancelled`, `skipped`. Terminal statuses are `finished`, `skipped`, and `cancelled`. A `failed` operation is not terminal and may be retried.

Neon limits overlapping operations per project. Requests that conflict with a running operation return `423 Locked`; retry with exponential backoff or wait for the in-flight operation to finish. Operations older than 6 months may be pruned.

You can also inspect operations from the CLI with [`neon operations`](/docs/cli/operations).

See [System operations](/docs/manage/operations) for polling guidance, retry examples, and a full list of operation types.

---

> API Reference / Operations / Retrieve operation details

## GET /projects/{project_id}/operations/{operation_id}

Retrieves details for the specified operation.
An operation is an action performed on a Neon project resource.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `operation_id` (string, path, required)
  The operation ID

### Response (200)

```json
{
  "operation": {
    "id": "a07f8772-1877-4da9-a939-3a3ae62d1d8d",
    "project_id": "floral-king-961888",
    "branch_id": "br-bitter-sound-247814",
    "endpoint_id": "ep-dark-snowflake-942567",
    "action": "create_timeline",
    "status": "finished",
    "failures_count": 0,
    "created_at": "2022-10-04T18:20:17Z",
    "updated_at": "2022-10-04T18:20:18Z",
    "total_duration_ms": 100
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/operations/$OPERATION_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectOperation({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    operation_id: process.env.OPERATION_ID
  }
});
```

### Console

Console path: Projects → Monitoring → System operations

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

---

> API Reference / Operations / List operations

## GET /projects/{project_id}/operations

Retrieves a list of operations for the specified Neon project.
The number of operations returned can be large.
To paginate the response, issue an initial request with a `limit` value.
Then, add the `cursor` value that was returned in the response to the next request.
Operations older than 6 months may be deleted from our systems.
If you need more history than that, you should store your own history.


### Parameters

- `cursor` (string, query, optional)
  Specify the cursor value from the previous response to get the next batch of operations
- `limit` (integer, query, optional)
  Specify a value from 1 to 1000 to limit number of operations in the response
- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "start_compute",
      "status": "finished",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 480
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "apply_config",
      "status": "finished",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T11:30:00Z",
      "total_duration_ms": 1438
    }
  ],
  "pagination": {
    "cursor": "2025-01-15T12:00:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/operations" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectOperations({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon operations list
```

### Console

Console path: Projects → Monitoring → System operations

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
