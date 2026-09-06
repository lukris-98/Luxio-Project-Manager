---
operationId: "acceptProjectTransferRequest"
method: "PUT"
path: "/projects/{project_id}/transfer_requests/{request_id}"
tag: "projects"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Projects / Accept a project transfer request

## PUT /projects/{project_id}/transfer_requests/{request_id}

Accepts a transfer request for the specified project, transferring it to the specified organization
or user. If org_id is not passed, the project will be transferred to the current user or organization account.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `request_id` (string, path, required)
  The Neon project transfer request ID

### Request body

- `org_id` (string, optional)
  The Neon organization ID to transfer the project to. If not provided, the project will be
  transferred to the current user or organization account.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/transfer_requests/$REQUEST_ID" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.acceptProjectTransferRequest({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    request_id: process.env.REQUEST_ID
  }
});
```

### Console

Console path: Claim

### Errors

**406**
Account doesn't satisfy the plan requirements to own the project
- `reasons` (array, required)
  List of reasons why the target account's plan cannot satisfy the transfer requirements. Each item contains a `code` identifying the constraint and a `message` with a human-readable explanation.
  - `message` (string, required)
    Description of why the plan is not satisfied
  - `code` (string, required)
    A short code identifying the reason

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
