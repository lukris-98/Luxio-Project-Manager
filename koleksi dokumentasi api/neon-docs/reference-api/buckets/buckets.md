# Buckets

Buckets are S3-compatible object storage built into the Neon backend. They branch with your data using the same copy-on-write model as Postgres: a new branch inherits its parent's buckets and their objects at the moment of forking. From there, uploads, overwrites, and deletes on a child are visible only on that branch and its descendants, and the parent stays unchanged.

These endpoints are served by your session, so they need no S3 credentials. For browser uploads or sharing a download with an unauthenticated client, use the presign endpoint; to remove a whole folder, use the delete-by-prefix endpoint. Call [Storage](/docs/reference/api/storage) first for the branch's S3 endpoint.

You can also manage buckets from the CLI with [`neon buckets`](/docs/cli/buckets).

Object Storage is in beta and available only in AWS US East (Ohio) (`aws-us-east-2`). See [Object Storage](/docs/storage/overview) for setup and [S3 compatibility](/docs/storage/s3-compatibility) for supported operations.

---

> API Reference / Buckets / List buckets on the branch

## GET /projects/{project_id}/branches/{branch_id}/buckets

Lists branchable object storage buckets visible on the specified branch,
including those inherited from ancestor branches.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Response (200)

```json
{
  "buckets": [
    {
      "name": "avatars",
      "access_level": "public_read",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "name": "backups",
      "access_level": "private",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "name": "my-bucket",
      "access_level": "private",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchBuckets({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon buckets list
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

---

> API Reference / Buckets / Create a bucket on the branch

## POST /projects/{project_id}/branches/{branch_id}/buckets

Creates a new branchable object storage bucket on the specified branch.
Buckets are managed by the Neon Platform branchable object storage service.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `name` (string, required)
  The bucket name.
- `access_level` (string, optional)
  Access level for the bucket. Defaults to `private`. Set to `public_read`
  to allow anonymous `GetObject`/`HeadObject` on objects in this bucket.
  
  Possible values: `private`, `public_read`
  Default: `private`

### Response (201)

```json
{
  "bucket": {
    "name": "my-bucket",
    "access_level": "private",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchBucket({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon buckets create <branch_id>
```

### Errors

**410**
The project has been deleted
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

---

> API Reference / Buckets / Delete a bucket on the branch

## DELETE /projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}

Deletes the named bucket from the specified branch.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `bucket_name` (string, path, required)
  The bucket name

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets/$BUCKET_NAME" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranchBucket({
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
neon buckets delete <branch_id>
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

---

> API Reference / Buckets / Delete an object in a bucket

## DELETE /projects/{project_id}/branches/{branch_id}/buckets/{bucket_name}/objects/{object_key}

Deletes the named object from the bucket on the specified branch.
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
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/buckets/$BUCKET_NAME/objects/$OBJECT_KEY" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranchBucketObject({
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
neon buckets object delete <branch_id>
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
