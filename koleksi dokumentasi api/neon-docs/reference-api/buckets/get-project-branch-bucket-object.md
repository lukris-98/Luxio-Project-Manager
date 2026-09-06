---
operationId: "getProjectBranchBucketObject"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects/{object_key}/download"
tag: "buckets"
stability: "beta"
interfaces: ["api", "sdk", "cli"]
---
> API Reference / Buckets / Download an object's bytes

## GET /projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects/{object_key}/download

Streams the raw bytes of the named object from the bucket on the
specified branch, including objects inherited from ancestor branches.
Served by the user's session (no customer S3 credentials required).

The body is returned as `application/octet-stream` so a browser treats
it as a download; the `Content-Length` and `ETag` response headers echo
the stored object metadata.

BINARY-STREAM EXCEPTION TO THE BUILD-GENERATED-TYPES RULE (#7029): the
successful 200 body is the raw object stream, proxied verbatim from the
platform object storage admin endpoint. It is modeled as an
`application/octet-stream` binary body (not a JSON response schema) and
is streamed without buffering the whole object in memory. Error
responses still use the generated `GeneralError` shape.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `bucket_name` (string, path, required)
  The bucket name
- `object_key` (string, path, required)
  The object key. Keys may contain `/`; the `/` characters of nested
  keys must be percent-encoded (`%2F`) in the path segment.
  

### Response (200)

The object's raw bytes, streamed verbatim. `Content-Length` and
`ETag` headers are set from the stored object metadata;
`X-Content-Type-Options` and `Content-Disposition` harden the
browser against the caller-controlled bytes.


### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets/$BUCKET_NAME/objects/$OBJECT_KEY/download" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchBucketObject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    bucket_name: process.env.BUCKET_NAME,
    object_key: process.env.OBJECT_KEY
  }
});
```

```bash
# neonctl
neon buckets object get <branch_id>
```

### Errors

**404**
Object not found
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
