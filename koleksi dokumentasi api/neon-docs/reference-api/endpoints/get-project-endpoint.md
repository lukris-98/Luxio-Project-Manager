---
operationId: "getProjectEndpoint"
method: "GET"
path: "/projects/{project_id}/endpoints/{endpoint_id}"
tag: "endpoints"
interfaces: ["api", "sdk"]
---
> API Reference / Endpoints / Retrieve compute endpoint details

## GET /projects/{project_id}/endpoints/{endpoint_id}

Retrieves information about the specified compute endpoint.
A compute endpoint is a Neon compute instance.
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
    "host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
    "hosts": {
      "read_only_host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
      "read_only_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-5.us-east-2.aws.neon.tech"
    },
    "id": "ep-cool-darkness-a5b6c7d8",
    "slug": "ep-cool-darkness-a5b6c7d8",
    "branch_slug": "br-young-forest-a5b6c7d8",
    "project_slug": "aged-wildflower-123456",
    "project_id": "aged-wildflower-123456",
    "branch_id": "br-young-forest-a5b6c7d8",
    "autoscaling_limit_min_cu": 1,
    "autoscaling_limit_max_cu": 1,
    "region_id": "aws-us-east-2",
    "type": "read_only",
    "current_state": "idle",
    "group": {
      "size": {
        "min": 1,
        "max": 1
      },
      "allow_readable_secondaries": true,
      "computes": [
        {
          "binding_id": "hx7",
          "current_state": "idle",
          "role": "read_only",
          "compute_host": "ep-cool-darkness-a5b6c7d8-hx7.c-5.us-east-2.aws.neon.tech",
          "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-hx7-pooler.c-5.us-east-2.aws.neon.tech",
          "created_at": "2025-01-15T10:30:00Z",
          "updated_at": "2025-01-15T11:00:00Z",
          "suspended_at": "2025-01-15T11:00:00Z"
        }
      ]
    },
    "settings": {
      "pg_settings": {
        "idle_in_transaction_session_timeout": "300000",
        "statement_timeout": "60000"
      }
    },
    "pooler_enabled": false,
    "pooler_mode": "transaction",
    "disabled": false,
    "passwordless_access": true,
    "last_active": "2025-01-15T11:30:00Z",
    "creation_source": "console",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "suspended_at": "2025-01-15T11:00:00Z",
    "proxy_host": "c-5.us-east-2.aws.neon.tech",
    "suspend_timeout_seconds": 0,
    "provisioner": "k8s-neonvm"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints/$ENDPOINT_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectEndpoint({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    endpoint_id: process.env.ENDPOINT_ID
  }
});
```

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
