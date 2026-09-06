---
operationId: "setSnapshotSchedule"
method: "PUT"
path: "/projects/{project_id}/branches/{branch_id}/backup_schedule"
tag: "snapshots"
interfaces: ["api", "sdk", "cli", "console"]
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
