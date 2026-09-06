---
operationId: "transferProjectsFromOrgToOrg"
method: "POST"
path: "/organizations/{source_org_id}/projects/transfer"
tag: "organizations"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Organizations / Transfer projects between organizations

## POST /organizations/{source_org_id}/projects/transfer

Transfers selected projects, identified by their IDs, from your organization to another specified organization.


### Parameters

- `source_org_id` (string, path, required)
  The Neon organization ID (source org, which currently owns the project)

### Request body

- `destination_org_id` (string, required)
  The destination organization identifier
- `project_ids` (array, required)
  The list of projects ids to transfer. Maximum of 400 project ids

### Response (200)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$SOURCE_ORG_ID/projects/transfer" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.transferProjectsFromOrgToOrg({
  client: neon.client,
  path: {
    source_org_id: process.env.SOURCE_ORG_ID
  }
});
```

### Console

Console path: Organization → Settings → Transfer projects

### Errors

**406**
Transfer failed. The target organization has too many projects or an incompatible plan. Reduce projects or upgrade the target organization.
- `limits` (array, required)
  Plan limits that were not satisfied by the request.
  - `name` (string, required)
    Identifier of the unsatisfied limit. Possible values are:
    - subscription_type
    - projects_count
    - project_region
    
  - `expected` (string, required)
    Required value for the limit named by `name`. Compare with `actual` to determine the shortfall.
  - `actual` (string, required)
    Current value of the named limit, which does not satisfy the required `expected` value.

**422**
Transfer failed. Projects with active integrations (for example, GitHub or Vercel) cannot be transferred.
- `projects` (array, required)
  Projects that have the requested integration, each including the project details and associated integration metadata.
  - `id` (string, required)
    The Neon project ID. Use as the `project_id` path parameter in other endpoints.
  - `integration` (string, required)
    Name of the external integration associated with the project.

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
