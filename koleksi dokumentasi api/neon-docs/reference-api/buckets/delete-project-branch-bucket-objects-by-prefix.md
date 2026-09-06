---
operationId: "deleteProjectBranchBucketObjectsByPrefix"
method: "DELETE"
path: "/projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects-by-prefix"
tag: "buckets"
stability: "beta"
interfaces: ["api", "sdk", "cli"]
---
> API Reference / Buckets / Delete every object under a key prefix (folder) in a bucket

## DELETE /projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects-by-prefix

Soft-deletes every object on the specified branch whose key starts with
`prefix`, in a single call. Intended to back a "delete folder" action in
an object browser: a `prefix` of `app/avatars/` removes every object
beneath that folder. Served by the user's session (no customer S3
credentials required).

`prefix` must be non-empty, end with `/`, be at most 1024 bytes, and
contain no control characters - a partial-segment prefix cannot
accidentally delete sibling keys. Returns the number of objects
soft-deleted (`deleted`), which may be 0 when no live object matched the
prefix on this branch.

Only objects physically present on this branch are tombstoned; objects
inherited from an ancestor branch via copy-on-write (not materialized on
this branch) are out of scope.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `bucket_name` (string, path, required)
  The bucket name
- `prefix` (string, query, required)
  The key prefix (folder) to delete. Must be non-empty and end with
  `/`. Every object on this branch whose key starts with this prefix
  is soft-deleted.
  

### Response (200)

```json
{
  "deleted": 1
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets/$BUCKET_NAME/objects-by-prefix?prefix=$PREFIX" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranchBucketObjectsByPrefix({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    bucket_name: process.env.BUCKET_NAME
  },
  query: {
    prefix: process.env.PREFIX
  }
});
```

```bash
# neonctl
neon buckets object delete <branch_id>
```

### Errors

**404**
Bucket not found
- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

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
