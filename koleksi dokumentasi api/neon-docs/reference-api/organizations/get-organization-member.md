---
operationId: "getOrganizationMember"
method: "GET"
path: "/organizations/{org_id}/members/{member_id}"
tag: "organizations"
interfaces: ["api", "sdk"]
---
> API Reference / Organizations / Retrieve organization member details

## GET /organizations/{org_id}/members/{member_id}

Retrieves information about the specified organization member.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `member_id` (string, path, required)
  The Neon organization member ID

### Response (200)

```json
{
  "id": "d57833f2-d308-4ede-9d2e-468d9d013d1b",
  "user_id": "b107d689-6dd2-4c9a-8b9e-0b25e457cf56",
  "org_id": "my-organization-morning-bread-81040908",
  "role": "admin",
  "joined_at": "2024-02-23T17:42:25Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/members/$MEMBER_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganizationMember({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    member_id: process.env.MEMBER_ID
  }
});
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
