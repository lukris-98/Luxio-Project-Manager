---
operationId: "restartProjectEndpoint"
method: "POST"
path: "/projects/{project_id}/endpoints/{endpoint_id}/restart"
tag: "endpoints"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Endpoints / Restart compute endpoint

## POST /projects/{project_id}/endpoints/{endpoint_id}/restart

Restarts the specified compute endpoint by immediately suspending it and then starting it again.
An `endpoint_id` has an `ep-` prefix.
For information about compute endpoints, see [Manage computes](https://neon.com/docs/manage/endpoints/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `endpoint_id` (string, path, required)
  The endpoint ID

### Response (200)

```json
{
  "endpoint": {
    "host": "ep-steep-bush-777093.us-east-2.aws.neon.tech",
    "id": "ep-steep-bush-777093",
    "project_id": "shiny-wind-028834",
    "branch_id": "br-raspy-hill-832856",
    "autoscaling_limit_min_cu": 1,
    "autoscaling_limit_max_cu": 1,
    "region_id": "aws-us-east-2",
    "type": "read_write",
    "current_state": "idle",
    "settings": {
      "pg_settings": {}
    },
    "pooler_enabled": false,
    "pooler_mode": "transaction",
    "disabled": false,
    "passwordless_access": true,
    "last_active": "2022-12-03T15:00:00Z",
    "created_at": "2022-12-03T15:37:07Z",
    "updated_at": "2022-12-03T15:49:10Z",
    "proxy_host": "us-east-2.aws.neon.tech",
    "creation_source": "console",
    "provisioner": "k8s-pod",
    "suspend_timeout_seconds": 10800
  },
  "operations": [
    {
      "id": "e061087e-3c99-4856-b9c8-6b7751a253af",
      "project_id": "bitter-meadow-966132",
      "branch_id": "br-proud-paper-090813",
      "endpoint_id": "ep-shrill-thunder-454069",
      "action": "suspend_compute",
      "status": "running",
      "failures_count": 0,
      "created_at": "2022-12-03T15:51:06Z",
      "updated_at": "2022-12-03T15:51:06Z",
      "total_duration_ms": 100
    },
    {
      "id": "e061087e-3c99-4856-b9c8-6b7751a253af",
      "project_id": "bitter-meadow-966132",
      "branch_id": "br-proud-paper-090813",
      "endpoint_id": "ep-shrill-thunder-454069",
      "action": "start_compute",
      "status": "running",
      "failures_count": 0,
      "created_at": "2022-12-03T15:51:06Z",
      "updated_at": "2022-12-03T15:51:06Z",
      "total_duration_ms": 100
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints/$ENDPOINT_ID/restart" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.restartProjectEndpoint({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    endpoint_id: process.env.ENDPOINT_ID
  }
});
```

### Console

Console path: Projects → Branches → Computes

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
