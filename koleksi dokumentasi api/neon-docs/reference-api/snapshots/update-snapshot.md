---
operationId: "updateSnapshot"
method: "PATCH"
path: "/projects/{project_id}/snapshots/{snapshot_id}"
tag: "snapshots"
interfaces: ["api", "sdk", "cli", "console"]
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
