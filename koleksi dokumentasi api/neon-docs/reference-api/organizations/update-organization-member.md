---
operationId: "updateOrganizationMember"
method: "PATCH"
path: "/organizations/{org_id}/members/{member_id}"
tag: "organizations"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Organizations / Update role for organization member

## PATCH /organizations/{org_id}/members/{member_id}

Updates the role of an existing member in the specified organization.
The requested role must be valid for the organization.
Only organization admins can call this endpoint.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `member_id` (string, path, required)
  The Neon organization member ID

### Request body

- `role` (string, required)
  Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`

```json
{
  "role": "member"
}
```

### Response (200)

- `id` (string, optional, format: uuid)
  The organization member's ID.
- `user_id` (string, optional, format: uuid)
  The Neon user ID.
- `org_id` (string, optional)
  The Neon organization ID. Returned as `id` from `GET /users/me/organizations`.
- `role` (string, optional)
  Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
- `joined_at` (string, optional, format: date-time)
  Timestamp when the user joined the organization.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/members/$MEMBER_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":"member"}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateOrganizationMember({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    member_id: process.env.MEMBER_ID
  },
  body: {
    role: "member"
  }
});
```

### Console

Console path: Organization → People → Members

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
