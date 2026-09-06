---
operationId: "listProjectBranchBucketObjects"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects"
tag: "buckets"
stability: "beta"
interfaces: ["api", "sdk", "cli"]
---
> API Reference / Buckets / List objects in a bucket

## GET /projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects

Lists objects visible in the named bucket on the specified branch,
including those inherited from ancestor branches. Listing is served by
the user's session (no customer S3 credentials required).

When `delimiter` is supplied (typically `/`), keys are collapsed into
common prefixes (`folders`) so callers can render a folder-style
browser; keys that do not contain the delimiter after `prefix` are
returned as `objects`.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `bucket_name` (string, path, required)
  The bucket name
- `prefix` (string, query, optional)
  Only list objects whose key starts with this prefix.
- `delimiter` (string, query, optional)
  Collapse keys sharing a common prefix up to the first occurrence of
  this delimiter (typically `/`) into the `folders` array.
  
- `cursor` (string, query, optional)
  Opaque pagination cursor returned as `next_cursor` by a previous
  call. Resume listing after the last item of the previous page.
  
- `limit` (integer, query, optional)
  Maximum number of items (objects + folders) to return.
  Default: `1000`

### Response (200)

```json
{
  "folders": [],
  "objects": [
    {
      "key": "uploads/hello.txt",
      "size": 11,
      "last_modified": "2025-01-15T10:30:00Z",
      "etag": "5eb63bbbe01eeed093cb22bb8f5acdc3"
    }
  ],
  "prefix": "",
  "is_truncated": false
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets/$BUCKET_NAME/objects" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchBucketObjects({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    bucket_name: process.env.BUCKET_NAME
  }
});
```

```bash
# neonctl
neon buckets object list <branch_id>
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
