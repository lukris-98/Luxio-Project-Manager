---
operationId: "updateProjectEndpoint"
method: "PATCH"
path: "/projects/{project_id}/endpoints/{endpoint_id}"
tag: "endpoints"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Endpoints / Update compute endpoint

## PATCH /projects/{project_id}/endpoints/{endpoint_id}

Updates the specified compute endpoint.

An `endpoint_id` has an `ep-` prefix. A `branch_id` has a `br-` prefix.
For more information about compute endpoints, see [Manage computes](https://neon.com/docs/manage/endpoints/).

If the returned list of operations is not empty, the compute endpoint is not ready to use.
The client must wait for the last operation to finish before using the compute endpoint.
If the compute endpoint was idle before the update, it becomes active for a short period of time,
and the control plane suspends it again after the update.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `endpoint_id` (string, path, required)
  The endpoint ID

### Request body

- `endpoint` (object, required)
  Parameters for the compute endpoint update.
  - `branch_id` (string, optional, deprecated)
    Deprecated. The destination branch ID; must not have an existing read-write endpoint.
    
  - `autoscaling_limit_min_cu` (number, optional)
    The minimum number of Compute Units. The minimum value is `0.25`.
    See [Compute size and Autoscaling configuration](https://neon.com/docs/manage/endpoints#compute-size-and-autoscaling-configuration)
    for more information.
    
  - `autoscaling_limit_max_cu` (number, optional)
    The maximum number of Compute Units.
    See [Compute size and Autoscaling configuration](https://neon.com/docs/manage/endpoints#compute-size-and-autoscaling-configuration)
    for more information.
    
  - `provisioner` (string, optional)
    Compute provisioner. `k8s-neonvm` (default) supports Autoscaling; `k8s-pod` is fixed-size compute. Also `docker` and `serverless-platform`.
  - `settings` (object, optional)
    A collection of settings for a compute endpoint
    - `pg_settings` (object, optional)
      A raw representation of Postgres settings
    - `pgbouncer_settings` (object, optional, deprecated)
      Deprecated. PgBouncer settings for the compute endpoint. Removal scheduled for June 20, 2026.
      
    - `preload_libraries` (object, optional)
      The shared libraries to preload into the project's compute instances.
      
      - `use_defaults` (boolean, optional)
        When true, the project's preload libraries include the platform default set in addition to any libraries listed in `enabled_libraries`.
      - `enabled_libraries` (array, optional)
        Names of shared preload libraries to enable for the project.
  - `pooler_enabled` (boolean, optional, deprecated)
    Deprecated. To enable connection pooling, append `-pooler` to the endpoint ID in the connection string.
    See [How to use connection pooling](https://neon.com/docs/connect/connection-pooling#how-to-use-connection-pooling)
    
  - `pooler_mode` (string, optional, deprecated)
    Deprecated. The connection pooler mode. Removal scheduled for June 20, 2026.
    
    Possible values: `transaction`
  - `disabled` (boolean, optional)
    Whether to restrict connections to the compute endpoint.
    Enabling this option schedules a suspend compute operation.
    A disabled compute endpoint cannot be enabled by a connection or
    console action. However, the compute endpoint is periodically
    enabled by check_availability operations.
    
  - `passwordless_access` (boolean, optional)
    NOT YET IMPLEMENTED. Whether to permit passwordless access to the compute endpoint.
    
  - `suspend_timeout_seconds` (integer, optional, format: int64)
    Scale-to-zero idle timeout, in seconds, before the compute suspends. `0` uses the plan default; `-1` disables scale-to-zero (never suspends). Minimum is plan-dependent (Scale: 60); maximum 604800 (one week). Free cannot change it; Launch can only enable or disable; Scale can set any value.
  - `name` (string, optional)
    Optional name of the compute endpoint
    

```json
{
  "endpoint": {
    "suspend_timeout_seconds": 300
  }
}
```

### Response (200)

```json
{
  "endpoint": {
    "host": "ep-cool-darkness-a5b6c7d8.c-4.us-east-2.aws.neon.tech",
    "hosts": {
      "read_only_host": "ep-cool-darkness-a5b6c7d8.c-4.us-east-2.aws.neon.tech",
      "read_only_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-4.us-east-2.aws.neon.tech"
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
          "binding_id": "lcw",
          "current_state": "idle",
          "role": "read_only",
          "compute_host": "ep-cool-darkness-a5b6c7d8-lcw.c-4.us-east-2.aws.neon.tech",
          "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-lcw-pooler.c-4.us-east-2.aws.neon.tech",
          "created_at": "2025-01-15T10:30:00Z",
          "updated_at": "2025-01-15T10:30:00Z"
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
    "last_active": "2025-01-15T11:00:00Z",
    "creation_source": "console",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "proxy_host": "c-4.us-east-2.aws.neon.tech",
    "suspend_timeout_seconds": 0,
    "provisioner": "k8s-neonvm"
  },
  "operations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints/$ENDPOINT_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint":{"suspend_timeout_seconds":300}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProjectEndpoint({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    endpoint_id: process.env.ENDPOINT_ID
  },
  body: {
    endpoint: {
      suspend_timeout_seconds: 300
    }
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
