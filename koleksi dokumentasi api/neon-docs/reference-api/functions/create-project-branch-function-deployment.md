---
operationId: "createProjectBranchFunctionDeployment"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/functions/{slug}/deployments"
tag: "functions"
stability: "beta"
interfaces: ["api", "sdk", "cli"]
---
> API Reference / Functions / Deploy code to a function

## POST /projects/{project_id}/branches/{branch_id}/functions/{slug}/deployments

Creates a deployment for the function. Supply any subset of zip,
environment, and runtime; omitted fields inherit the
function's latest version. At least one field must be supplied. The
first deployment of a function must include zip. The newest deployment
becomes active.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `slug` (string, path, required)
  The function slug

### Request body


### Response (201)

```json
{
  "deployment": {
    "id": 1,
    "status": "pending",
    "memory_mib": 2048,
    "runtime": "nodejs24",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/functions/$SLUG/deployments" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchFunctionDeployment({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    slug: process.env.SLUG
  }
});
```

```bash
# neonctl
neon functions deploy <branch_id>
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
