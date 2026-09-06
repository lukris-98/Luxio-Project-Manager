---
operationId: "finalizeRestoreBranch"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/finalize_restore"
tag: "branches"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Branches / Finalize branch restore from snapshot

## POST /projects/{project_id}/branches/{branch_id}/finalize_restore

Finalize the restore operation for a branch created from a snapshot.
This operation updates the branch so it functions as the original branch it replaced.
This includes:
  - Reassigning any computes from the original branch to the restored branch (this will restart the computes)
  - Renaming the restored branch to the original branch's name
  - Renaming the original branch so it no longer uses the original name

This operation only applies to branches created using the `restoreSnapshot` endpoint with `finalize_restore: false`.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `name` (string, optional)
  Name for the replaced branch. If omitted, a unique name is generated.

### Response (200)

- `operations` (array, optional)
  - `id` (string, required, format: uuid)
    The operation ID
  - `project_id` (string, required)
    The ID of the project this operation ran on.
  - `branch_id` (string, optional)
    The ID of the branch this operation ran on.
  - `endpoint_id` (string, optional)
    The ID of the compute endpoint this operation ran on.
  - `action` (string, required)
    The action performed by the operation
    Possible values: `create_compute`, `create_timeline`, `start_compute`, `suspend_compute`, `apply_config`, `check_availability`, `delete_timeline`, `create_branch`, `import_data`, `tenant_ignore`, `tenant_attach`, `tenant_detach`, `tenant_detach_safekeepers`, `tenant_attach_safekeepers`, `tenant_reattach`, `replace_safekeeper`, `disable_maintenance`, `apply_storage_config`, `prepare_secondary_pageserver`, `switch_pageserver`, `detach_parent_branch`, `timeline_archive`, `timeline_unarchive`, `start_reserved_compute`, `sync_dbs_and_roles_from_compute`, `apply_schema_from_branch`, `timeline_mark_invisible`, `timeline_update_protected_config`, `prewarm_replica`, `promote_replica`, `set_storage_non_dirty`, `swap_binding_id`, `finalize_migration`, `mark_migration_prepared`, `update_catalog`, `epc_sync`
  - `status` (string, required)
    Current lifecycle state of the operation. On `failed`, see `failures_count` and `retry_at` for retry detail.
    Possible values: `scheduling`, `running`, `finished`, `failed`, `error`, `cancelling`, `cancelled`, `skipped`
  - `error` (string, optional)
    Human-readable message describing why the operation failed.
  - `failures_count` (integer, required, format: int32)
    The number of times the operation failed
  - `retry_at` (string, optional, format: date-time)
    A timestamp indicating when the operation was last retried
  - `created_at` (string, required, format: date-time)
    A timestamp indicating when the operation was created
  - `updated_at` (string, required, format: date-time)
    A timestamp indicating when the operation status was last updated
  - `total_duration_ms` (integer, required, format: int32)
    The total duration of the operation in milliseconds

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/finalize_restore" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.finalizeRestoreBranch({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon snapshots finalize <branch_id>
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
