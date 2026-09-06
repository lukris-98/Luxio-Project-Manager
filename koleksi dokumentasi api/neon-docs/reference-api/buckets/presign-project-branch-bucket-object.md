---
operationId: "presignProjectBranchBucketObject"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects/{object_key}/presign"
tag: "buckets"
stability: "beta"
interfaces: ["api", "sdk"]
---
> API Reference / Buckets / Presign an upload or download for an object in a bucket

## POST /projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects/{object_key}/presign

Returns a presigned URL that transfers bytes directly to or from the
object's bucket on the specified branch, without the caller ever
handling S3 credentials. The `operation` field selects the direction:

- `upload` returns a presigned `PUT` URL (the caller `PUT`s the file
  bytes straight to `url` with the returned `headers`). Authorized with
  project write access.
- `download` returns a presigned `GET` URL (the caller `GET`s the
  bytes straight from `url`). Authorized with project read access.

The platform mints a short-lived credential and builds the SigV4-signed
URL against the branch's S3 data-plane host, returning it together with
the HTTP method, any headers the caller must echo, and the URL's expiry.

Served by the user's session (no customer S3 credentials required).

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
  

### Request body

- `operation` (string, required)
  The transfer direction. `upload` returns a presigned `PUT` URL;
  `download` returns a presigned `GET` URL.
  
  Possible values: `upload`, `download`
- `content_type` (string, optional)
  The `Content-Type` to bind into the signed request. Only meaningful
  for `upload`: when set, the caller MUST send the same `Content-Type`
  header on the `PUT`, and the value is echoed back in the response
  `headers`. Ignored for `download`.
  
- `expires_in_seconds` (integer, optional, format: int64)
  How long the presigned URL stays valid, in seconds. Defaults to 900
  (15 minutes); capped at 604800 (7 days).
  
  Default: `900`

### Response (200)

```json
{
  "url": "https://br-young-forest-a5b6c7d8.storage.c-5.us-east-2.aws.neon.tech/user-uploads-ms9mbu2o16/uploads/hello.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=nak_live_00000000000000000000000000000000%2Fus-east-2&X-Amz-Date=20250115T103000Z&X-Amz-Expires=900&X-Amz-Signature=0000000000000000000000000000000000000000000000000000000000000000&X-Amz-SignedHeaders=host",
  "method": "GET",
  "headers": {},
  "expires_at": "2025-02-15T10:30:00Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets/$BUCKET_NAME/objects/$OBJECT_KEY/presign" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.presignProjectBranchBucketObject({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    bucket_name: process.env.BUCKET_NAME,
    object_key: process.env.OBJECT_KEY
  }
});
```

### Errors

**404**
Bucket or branch not found
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
