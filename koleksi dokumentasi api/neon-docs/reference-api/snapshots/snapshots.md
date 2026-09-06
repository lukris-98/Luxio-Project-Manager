# Snapshots

Snapshots are point-in-time copies of a branch stored without an attached compute. You can create them on demand (1 on the Free plan, 10 on paid plans); paid plans also support scheduled snapshots, which don't count toward the manual limit.

Manual snapshots can only be created from root branches. Unlike a branch, a snapshot has no attached compute; it's a stored backup copy you restore from rather than connect to directly.

Use these endpoints to create snapshots manually, list them, restore from them, or delete them. Scheduled snapshots are managed automatically; you interact with them mainly when restoring.

You can also manage snapshots from the CLI with [`neon snapshots`](/docs/cli/snapshots).

See [Backup and restore](/docs/guides/backup-restore) for pricing and usage details.

---

> API Reference / Snapshots / Create snapshot

## POST /projects/{project_id}/branches/{branch_id}/snapshot

Creates a snapshot from the specified branch.
This operation may initiate an asynchronous process.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `lsn` (string, query, optional)
  The target Log Sequence Number (LSN) to take the snapshot from.
  Must fall within the restore window. Cannot be used with `timestamp`
  
- `timestamp` (string, query, optional)
  The target timestamp for the snapshot. Must fall within the restore window. RFC 3339 format. Cannot be used with `lsn`.
  
- `name` (string, query, optional)
  A name for the snapshot.
- `expires_at` (string, query, optional)
  The time at which the snapshot will be automatically deleted. RFC 3339 format.
  

### Response (200)

```json
{
  "snapshot": {
    "id": "snap-quiet-meadow-a5b6c7d8",
    "name": "my-snapshot-2",
    "source_branch_id": "br-young-forest-a5b6c7d8",
    "created_at": "2025-01-15T10:30:00Z",
    "manual": true
  },
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-12345678",
      "action": "create_branch",
      "status": "running",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-12345678",
      "action": "timeline_archive",
      "status": "scheduling",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/snapshot" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createSnapshot({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  query: {
    timestamp: "2025-08-05T22:00:00Z",
    expires_at: "2025-08-05T22:00:00Z"
  }
});
```

```bash
# neonctl
neon snapshots create
```

### Console

Console path: Projects → Backup & restore

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

> API Reference / Snapshots / List project snapshots

## GET /projects/{project_id}/snapshots

Lists the snapshots for the specified project.
Each snapshot represents a point-in-time backup of the project data.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

```json
{
  "snapshots": [
    {
      "id": "snap-quiet-meadow-a5b6c7d8",
      "name": "my-snapshot-3",
      "source_branch_id": "br-young-forest-a5b6c7d8",
      "created_at": "2025-01-15T10:30:00Z",
      "manual": true
    },
    {
      "id": "snap-quiet-meadow-12345678",
      "name": "my-snapshot-2",
      "source_branch_id": "br-young-forest-a5b6c7d8",
      "created_at": "2025-01-15T10:30:00Z",
      "manual": true
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/snapshots" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listSnapshots({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
```

```bash
# neonctl
neon snapshots list
```

### Console

Console path: Projects → Backup & restore

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

> API Reference / Snapshots / Update snapshot

## PATCH /projects/{project_id}/snapshots/{snapshot_id}

Updates the specified snapshot.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `snapshot_id` (string, path, required)
  The snapshot ID

### Request body

- `snapshot` (object, required)
  Fields to update on the snapshot. Updatable fields include `name` and `expires_at`.
  - `name` (string, optional)
    Human-readable label for the snapshot.
  - `expires_at` (string, optional, format: date-time)
    The date and time when the snapshot will expire.
    
    Omit to leave the current expiration unchanged. Send `null` to
    clear the expiration so the snapshot never expires. A future
    timestamp sets the absolute expiration.
    

### Response (200)

```json
{
  "snapshot": {
    "id": "snap-quiet-meadow-a5b6c7d8",
    "name": "my-snapshot-8-renamed",
    "source_branch_id": "br-young-forest-a5b6c7d8",
    "created_at": "2025-01-15T10:30:00Z",
    "manual": true
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/snapshots/$SNAPSHOT_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateSnapshot({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    snapshot_id: process.env.SNAPSHOT_ID
  }
});
```

```bash
# neonctl
neon snapshots update <snapshot_id>
```

### Console

Console path: Projects → Backup & restore

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

> API Reference / Snapshots / Delete snapshot

## DELETE /projects/{project_id}/snapshots/{snapshot_id}

Deletes the specified snapshot.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `snapshot_id` (string, path, required)
  The snapshot ID

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/snapshots/$SNAPSHOT_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteSnapshot({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    snapshot_id: process.env.SNAPSHOT_ID
  }
});
```

```bash
# neonctl
neon snapshots delete <snapshot_id>
```

### Console

Console path: Projects → Backup & restore

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

> API Reference / Snapshots / Restore snapshot

## POST /projects/{project_id}/snapshots/{snapshot_id}/restore

Restores the specified snapshot to a new branch,
and optionally finalizes the restore operation to replace the original branch.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `snapshot_id` (string, path, required)
  The snapshot ID
- `name` (string, query, optional)
  Deprecated. Use the `name` field in the request body instead. Removal scheduled for November 29, 2025.
  A name for the newly restored branch. If omitted, a default name will be generated.
  

### Request body

- `name` (string, optional)
  A name for the newly restored branch. If not provided, the server generates a unique name for the branch automatically.
  
- `target_branch_id` (string, optional)
  ID of the branch to restore the snapshot into. Defaults to the snapshot's source branch (`snapshot.source_branch_id`); fails if that cannot be determined.
  
- `finalize_restore` (boolean, optional)
  Set to `true` to finalize the restore operation immediately.
  This will complete the restore and move any associated computes to the new branch,
  similar to the `finalizeRestoreBranch` operation.
  Defaults to `false` to allow previewing the restored snapshot data first.
  
  Default: `false`

### Response (200)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_lsn": "0/1ADB9F8",
    "name": "restored-from-snapshot",
    "slug": "br-young-forest-a5b6c7d8",
    "current_state": "init",
    "pending_state": "ready",
    "state_changed_at": "2025-01-15T10:30:00Z",
    "creation_source": "console",
    "primary": false,
    "default": false,
    "protected": false,
    "cpu_used_sec": 0,
    "compute_time_seconds": 0,
    "active_time_seconds": 0,
    "written_data_bytes": 0,
    "data_transfer_bytes": 0,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "init_source": "parent-data",
    "restore_status": "restored",
    "restored_from": "snap-quiet-meadow-a5b6c7d8",
    "restored_as": "br-young-forest-12345678"
  },
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
      "current_state": "init",
      "pending_state": "active",
      "group": {
        "size": {
          "min": 1,
          "max": 1
        },
        "allow_readable_secondaries": false,
        "computes": [
          {
            "binding_id": "sw2",
            "current_state": "init",
            "pending_state": "active",
            "role": "read_write",
            "compute_host": "ep-cool-darkness-a5b6c7d8-sw2.c-5.us-east-2.aws.neon.tech",
            "compute_pooled_host": "ep-cool-darkness-a5b6c7d8-sw2-pooler.c-5.us-east-2.aws.neon.tech",
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-15T10:30:00Z"
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
      "creation_source": "console",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "proxy_host": "c-5.us-east-2.aws.neon.tech",
      "suspend_timeout_seconds": 0,
      "provisioner": "k8s-neonvm"
    }
  ],
  "operations": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-12345678",
      "action": "timeline_unarchive",
      "status": "running",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "action": "create_branch",
      "status": "scheduling",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    },
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "project_id": "aged-wildflower-123456",
      "branch_id": "br-young-forest-a5b6c7d8",
      "endpoint_id": "ep-cool-darkness-a5b6c7d8",
      "action": "start_compute",
      "status": "scheduling",
      "failures_count": 0,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "total_duration_ms": 0
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/snapshots/$SNAPSHOT_ID/restore" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.restoreSnapshot({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    snapshot_id: process.env.SNAPSHOT_ID
  }
});
```

```bash
# neonctl
neon snapshots restore <snapshot_id>
```

### Console

Console path: Projects → Backup & restore

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

> API Reference / Snapshots / Retrieve backup schedule

## GET /projects/{project_id}/branches/{branch_id}/backup_schedule

Returns the backup schedule for the specified branch, including the configured snapshot frequencies.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "schedule": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/backup_schedule" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getSnapshotSchedule({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon snapshots schedule get
```

### Console

Console path: Projects → Backup & restore

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

> API Reference / Snapshots / Update backup schedule

## PUT /projects/{project_id}/branches/{branch_id}/backup_schedule

Updates the backup schedule for the specified branch.
The schedule defines how often automatic snapshots are created (for example, `daily` or `weekly`). Requires a paid plan.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `schedule` (array, required)
  List of schedule entries defining the backup frequency. At least one entry is required.
  - `frequency` (string, required)
    How often to take snapshots. Known values: `daily`, `weekly`, `monthly`.
    
  - `hour` (integer, optional)
    The hour of the day to take the snapshot (if applicable).
    
  - `day` (integer, optional)
    The day of the week or month to take the snapshot (if applicable).
    
  - `month` (integer, optional)
    The month of the year to take the snapshot (if applicable).
    
  - `retention_seconds` (integer, optional)
    How long to keep a scheduled snapshot (in seconds) before it's automatically deleted.
    The default is 3024000 seconds (35 days), which is also the maximum.
    Manually created snapshots have no maximum retention: set their `expires_at` instead.
    
    Default: `3024000`

### Response (200)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/backup_schedule" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.setSnapshotSchedule({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon snapshots schedule set
```

### Console

Console path: Projects → Backup & restore

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
