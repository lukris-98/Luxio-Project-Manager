---
operationId: "createSnapshot"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/snapshot"
tag: "snapshots"
interfaces: ["api", "sdk", "cli", "console"]
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
