---
operationId: "createOrganizationInvitations"
method: "POST"
path: "/organizations/{org_id}/invitations"
tag: "organizations"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Organizations / Create organization invitations

## POST /organizations/{org_id}/invitations

Creates invitations for a specific organization.
If the invited user has an existing account, they automatically join as a member.
If they don't yet have an account, they are invited to create one, after which they become a member.
Each invited user receives an email notification.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Request body

- `invitations` (array, required)
  Invitations to create for the organization.
  - `email` (string, required, format: email)
    Email address of the person to invite to the organization.
  - `role` (string, required)
    Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
    Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`

```json
{
  "invitations": [
    {
      "email": "invited-user@email.com",
      "role": "member"
    }
  ]
}
```

### Response (200)

- `invitations` (array, optional)
  List of pending invitations for the organization.
  - `id` (string, required, format: uuid)
    The invitation ID.
  - `email` (string, required, format: email)
    Email of the invited user
  - `org_id` (string, required)
    Organization id as it is stored in Neon
  - `invited_by` (string, required, format: uuid)
    UUID for the user_id who extended the invitation
  - `invited_at` (string, required, format: date-time)
    Timestamp when the invitation was created
  - `role` (string, required)
    Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
    Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/invitations" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"invitations":[{"email":"invited-user@email.com","role":"member"}]}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createOrganizationInvitations({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  },
  body: {
    invitations: [
      {
        email: "invited-user@email.com",
        role: "member"
      }
    ]
  }
});
```

### Console

Console path: Organization → People

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
