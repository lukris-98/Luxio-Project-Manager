---
operationId: "updateProjectBranch"
method: "PATCH"
path: "/projects/{project_id}/branches/{branch_id}"
tag: "branches"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Branches / Update branch

## PATCH /projects/{project_id}/branches/{branch_id}

Updates the specified branch.
For more information, see [Manage branches](https://neon.com/docs/manage/branches/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `branch` (object, required)
  Branch attributes to update. Supply only the fields you want to change, for example `name` or `protected`.
  - `name` (string, optional)
    New display name for the branch.
  - `protected` (boolean, optional)
    Whether the branch is protected. Protected branches (and their computes) cannot be deleted, archived, or reset, and block deletion of the project. Can be gated by `protected_branches_only` in the IP allowlist. Paid plans only.
    
  - `expires_at` (string, optional, format: date-time)
    The timestamp when the branch is scheduled to expire and be automatically deleted. Must be set by the client following the [RFC 3339, section 5.6](https://tools.ietf.org/html/rfc3339#section-5.6) format with precision up to seconds (such as 2025-06-09T18:02:16Z). Deletion is performed by a background job and may not occur exactly at the specified time. If this field is set to null, the expiration timestamp is removed.
    
    Access to this feature is currently limited to participants in the Early Access Program.
    

```json
{
  "branch": {
    "name": "mybranch"
  }
}
```

### Response (200)

```json
{
  "branch": {
    "id": "br-young-forest-a5b6c7d8",
    "project_id": "aged-wildflower-123456",
    "parent_id": "br-young-forest-a5b6c7d8",
    "parent_lsn": "0/1964258",
    "parent_timestamp": "2025-01-15T10:30:00Z",
    "name": "my-branch-5-renamed",
    "slug": "br-young-forest-a5b6c7d8",
    "project_slug": "aged-wildflower-123456",
    "current_state": "ready",
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
    "init_source": "parent-data"
  },
  "operations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"branch":{"name":"mybranch"}}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProjectBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  body: {
    branch: {
      name: "mybranch"
    }
  }
});
```

### Console

Console path: Projects → Branches

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
