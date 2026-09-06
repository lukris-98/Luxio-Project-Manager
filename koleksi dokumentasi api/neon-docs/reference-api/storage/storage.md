# Storage

This read-only endpoint returns the S3 connection details for a branch: `s3_endpoint`, `region`, and `force_path_style`. Call it before issuing bucket calls, so you know the branch is ready and you have the endpoint your S3 client needs.

A `404` means object storage isn't available for that branch, with a `reason` field explaining why.

Neon Object Storage uses path-style addressing only, which is why `force_path_style` is returned. See [S3 compatibility](/docs/storage/s3-compatibility) for client configuration and [Buckets](/docs/reference/api/buckets) for the endpoints that read and write data, or manage buckets and objects from the CLI with [`neon buckets`](/docs/cli/buckets), which handles these S3 details for you.

Object Storage is in beta and available only in AWS US East (Ohio) (`aws-us-east-2`).

---

> API Reference / Storage / Get branch object storage state

## GET /projects/{project_id}/branches/{branch_id}/storage

Returns whether branchable object storage is usable for the specified
branch. A 200 response means the branch is registered in the object storage
service and the S3 data plane will accept requests for it. A 404
response includes a `reason` field indicating why object storage is unavailable.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Response (200)

```json
{
  "enabled": true,
  "s3_endpoint": "https://br-young-forest-a5b6c7d8.storage.c-5.us-east-2.aws.neon.tech",
  "region": "us-east-2",
  "force_path_style": true
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/storage" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchStorage({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Errors

**404**
Object storage is not enabled for this branch, or the project/branch was not
found. The body is always `BranchStorageNotEnabled` — see `reason` for
the exact cause.

- `code` (string, required)
- `message` (string, required)
- `reason` (string, required)
  Machine-readable reason why object storage is unavailable:
  - `org_not_entitled`: the org's `PlatformBranchableStorage` feature flag is off.
  - `region_unavailable`: the project's region has no object storage admin service wired.
  - `branch_directory_missing`: the branch is not registered in the object storage service.
  - `branch_not_found`: the project or branch does not exist, or the caller does not
    have access to it.
  
  Possible values: `org_not_entitled`, `region_unavailable`, `branch_directory_missing`, `branch_not_found`

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
