---
operationId: "getProjectBranchAiGateway"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/ai_gateway"
tag: "ai-gateway"
stability: "beta"
interfaces: ["api", "sdk"]
---
> API Reference / AI Gateway / Get branch AI Gateway endpoint

## GET /projects/{project_id}/branches/{branch_id}/ai_gateway

Returns the AI Gateway endpoint host for the specified branch, used to
render code-snippet base URLs. A 200 response means the branch is
registered and this region serves the AI gateway. A 404 response
includes a `reason` field indicating why the gateway is unavailable.

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
  "base_url": "https://br-young-forest-a5b6c7d8-api.ai.c-5.us-east-2.aws.neon.tech"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/ai_gateway" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchAiGateway({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Errors

**404**
AI Gateway is not available for this branch, or the project/branch
was not found. The body is always `BranchAiGatewayNotEnabled` — see
`reason` for the exact cause.

- `code` (string, required)
- `message` (string, required)
- `reason` (string, required)
  Machine-readable reason why the AI gateway is unavailable:
  - `ai_gateway_unavailable`: the project's region/cell has no AI gateway configured.
  - `branch_not_found`: the project or branch does not exist, or the caller does not
    have access to it.
  
  Possible values: `ai_gateway_unavailable`, `branch_not_found`

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
