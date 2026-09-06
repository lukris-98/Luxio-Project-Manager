# Endpoints

In Neon, a compute endpoint is the Postgres instance attached to a branch, not an HTTP endpoint. Applications connect over the standard Postgres protocol.

Each branch has one primary read-write compute and can have multiple read-only computes for read replicas. Read replicas read from the same storage as the primary; no data is duplicated. Computes scale to zero after a period of inactivity (5 minutes by default) and wake automatically on the next connection. You can configure the timeout via `suspend_timeout_seconds`.

Use these endpoints to create, configure, restart, or delete computes. Common uses include adding read replicas, tuning compute size, and adjusting scale-to-zero behavior. Note that changing a compute's size restarts the endpoint and briefly disconnects active connections.

See [Manage computes](/docs/manage/computes) and [Read replicas](/docs/introduction/read-replicas) for configuration details.

---

> API Reference / Endpoints / List compute endpoints

## GET /projects/{project_id}/endpoints

Retrieves a list of compute endpoints for the specified project.
A compute endpoint is a Neon compute instance.
For information about compute endpoints, see [Manage computes](https://neon.com/docs/manage/endpoints/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "endpoints": [
    {
      "host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
      "hosts": {
        "read_write_host": "ep-cool-darkness-a5b6c7d8.c-5.us-east-2.aws.neon.tech",
        "read_write_pooled_host": "ep-cool-darkness-a5b6c7d8-pooler.c-5.us-east-2.aws.neon.tech"
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
      "type": "read_write",
      "current_state": "idle",
      "group": {
        "size": {
          "min": 1,
          "max": 1
        },
        "allow_readable_secondaries": false,
        "computes": [
          {
            "binding_id": "tcj",
            "current_state": "idle",
            "role": "read_write",
            "compute_host": "ep-cool-darkness-a5b6c7d8-tcj.c-5.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-tcj-pooler.c-5.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-15T10:30:00Z"
          }
        ]
      },
      "settings": {
        "pg_settings": {},
        "preload_libraries": {
          "use_defaults": false,
          "enabled_libraries": [
            "anon"
          ]
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
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm"
    },
    {
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
            "created_at": "2025-01-15T11:30:00Z",
            "updated_at": "2025-01-15T12:00:00Z",
            "suspended_at": "2025-01-15T12:00:00Z"
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
      "created_at": "2025-01-15T11:30:00Z",
      "updated_at": "2025-01-15T12:00:00Z",
      "suspended_at": "2025-01-15T12:00:00Z",
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm"
    },
    {
      "host": "ep-cool-darkness-12345678.c-5.us-east-2.aws.neon.tech",
      "hosts": {
        "read_write_host": "ep-cool-darkness-12345678.c-5.us-east-2.aws.neon.tech",
        "read_write_pooled_host": "ep-cool-darkness-12345678-pooler.c-5.us-east-2.aws.neon.tech"
      },
      "id": "ep-cool-darkness-12345678",
      "slug": "ep-cool-darkness-12345678",
      "branch_slug": "br-young-forest-12345678",
      "project_slug": "aged-wildflower-123456",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-12345678",
      "autoscaling_limit_min_cu": 1,
      "autoscaling_limit_max_cu": 1,
      "region_id": "aws-us-east-2",
      "type": "read_write",
      "current_state": "active",
      "group": {
        "size": {
          "min": 1,
          "max": 1
        },
        "allow_readable_secondaries": false,
        "computes": [
          {
            "binding_id": "z92",
            "current_state": "active",
            "role": "read_write",
            "compute_host": "ep-cool-darkness-12345678-z92.c-5.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-12345678-z92-pooler.c-5.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T12:30:00Z",
            "updated_at": "2025-01-15T13:00:00Z",
            "started_at": "2025-01-15T13:00:00Z"
          }
        ]
      },
      "settings": {
        "pg_settings": {}
      },
      "pooler_enabled": false,
      "pooler_mode": "transaction",
      "disabled": false,
      "passwordless_access": true,
      "last_active": "2025-01-15T13:30:00Z",
      "creation_source": "console",
      "created_at": "2025-01-15T12:30:00Z",
      "updated_at": "2025-01-15T14:00:00Z",
      "started_at": "2025-01-15T13:00:00Z",
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm",
      "compute_release_version": "13903"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectEndpoints({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

### MCP

Tool: `list_branch_computes`

List compute endpoints for a project or branch. Do not use when you need a connection string: use `get_connection_string`, which requires write access and is unavailable in read-only mode.

- `projectId` (string, optional)
  The ID of the project. If not provided, the only available project will be used.
- `branchId` (string, optional)
  The ID of the branch. If provided, endpoints for this specific branch will be listed.

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

---

> API Reference / Endpoints / Create compute endpoint

## POST /projects/{project_id}/endpoints

Creates a compute endpoint for the specified branch.
A compute endpoint is a Neon compute instance.
There is a maximum of one read-write compute endpoint per branch.
If the specified branch already has a read-write compute endpoint, the operation fails.
A branch can have multiple read-only compute endpoints.

For more information about compute endpoints, see [Manage computes](https://neon.com/docs/manage/endpoints/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `endpoint` (object, required)
  Configuration for the compute endpoint to create.
  - `branch_id` (string, required)
    The ID of the branch the compute endpoint will be associated with
    
  - `region_id` (string, optional)
    The region where the compute endpoint will be created. Only the project's `region_id` is permitted.
    
  - `type` (string, required)
    Compute endpoint type. `read_write`: the primary read-write endpoint (one per branch). `read_only`: a read replica endpoint (multiple allowed per branch).
    Possible values: `read_only`, `read_write`
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
    "branch_id": "br-floral-mountain-251143",
    "type": "read_write"
  }
}
```

### Response (201)

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
          "binding_id": "hqh",
          "current_state": "idle",
          "role": "read_only",
          "compute_host": "ep-cool-darkness-a5b6c7d8-hqh.c-4.us-east-2.aws.neon.tech",
          "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-hqh-pooler.c-4.us-east-2.aws.neon.tech",
          "created_at": "2025-01-15T10:30:00Z",
          "updated_at": "2025-01-15T10:30:00Z"
        }
      ]
    },
    "settings": {},
    "pooler_enabled": false,
    "pooler_mode": "transaction",
    "disabled": false,
    "passwordless_access": true,
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint":{"branch_id":"br-floral-mountain-251143","type":"read_write"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectEndpoint({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  },
  body: {
    endpoint: {
      branch_id: "br-floral-mountain-251143",
      type: "read_write"
    }
  }
});
```

```bash
# neonctl
neon branches add-compute <id|name>
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

---

> API Reference / Endpoints / Delete compute endpoint

## DELETE /projects/{project_id}/endpoints/{endpoint_id}

Deletes the specified compute endpoint.
A compute endpoint is a Neon compute instance.
Deleting a compute endpoint drops existing network connections to the compute endpoint.
The deletion is completed when the last operation in the chain finishes successfully.

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
    "current_state": "active",
    "pending_state": "idle",
    "group": {
      "size": {
        "min": 1,
        "max": 1
      },
      "allow_readable_secondaries": true,
      "computes": [
        {
          "binding_id": "fgc",
          "current_state": "active",
          "pending_state": "idle",
          "role": "read_only",
          "compute_host": "ep-cool-darkness-a5b6c7d8-fgc.c-5.us-east-2.aws.neon.tech",
          "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-fgc-pooler.c-5.us-east-2.aws.neon.tech",
          "created_at": "2025-01-15T10:30:00Z",
          "updated_at": "2025-01-15T11:00:00Z",
          "started_at": "2025-01-15T11:30:00Z"
        }
      ]
    },
    "settings": {
      "pg_settings": {
        "statement_timeout": "60000",
        "idle_in_transaction_session_timeout": "300000"
      }
    },
    "pooler_enabled": false,
    "pooler_mode": "transaction",
    "disabled": false,
    "passwordless_access": true,
    "last_active": "2025-01-15T12:00:00Z",
    "creation_source": "console",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "started_at": "2025-01-15T11:30:00Z",
    "proxy_host": "c-5.us-east-2.aws.neon.tech",
    "suspend_timeout_seconds": 0,
    "provisioner": "k8s-neonvm"
  },
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "suspend_compute",
      "status": "running",
      "failures_count": 0,
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints/$ENDPOINT_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectEndpoint({
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

---

> API Reference / Endpoints / Start compute endpoint

## POST /projects/{project_id}/endpoints/{endpoint_id}/start

Starts a compute endpoint.
The compute endpoint is ready to use after the last operation in the chain finishes successfully.

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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints/$ENDPOINT_ID/start" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.startProjectEndpoint({
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

---

> API Reference / Endpoints / Suspend compute endpoint

## POST /projects/{project_id}/endpoints/{endpoint_id}/suspend

Suspends the specified compute endpoint.
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
          "binding_id": "czk",
          "current_state": "idle",
          "role": "read_only",
          "compute_host": "ep-cool-darkness-a5b6c7d8-czk.c-4.us-east-2.aws.neon.tech",
          "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-czk-pooler.c-4.us-east-2.aws.neon.tech",
          "created_at": "2025-01-15T10:30:00Z",
          "updated_at": "2025-01-15T10:30:00Z"
        }
      ]
    },
    "settings": {
      "pg_settings": {
        "statement_timeout": "60000",
        "idle_in_transaction_session_timeout": "300000"
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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/endpoints/$ENDPOINT_ID/suspend" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.suspendProjectEndpoint({
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
