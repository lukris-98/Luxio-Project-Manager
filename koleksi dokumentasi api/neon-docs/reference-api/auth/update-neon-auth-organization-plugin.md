---
operationId: "updateNeonAuthOrganizationPlugin"
method: "PATCH"
path: "/projects/{project_id}/branches/{branch_id}/auth/plugins/organization"
tag: "auth"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Authentication / Update organization plugin configuration

## PATCH /projects/{project_id}/branches/{branch_id}/auth/plugins/organization

Updates the organization plugin configuration for Neon Auth.
The organization plugin enables multi-tenant organization support.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `enabled` (boolean, optional)
  Controls whether the organization plugin is active for the organization.
- `organization_limit` (integer, optional, format: int32)
  Maximum organizations a user can belong to (created or joined). At the limit, the user cannot create or join more.
- `membership_limit` (integer, optional, format: int32)
  Maximum members per organization.
- `creator_role` (string, optional)
  Role of the organization's creator. `owner`: full control, including deleting the org and transferring ownership. `admin`: manage members and settings only.
  Possible values: `admin`, `owner`
- `send_invitation_email` (boolean, optional)
  When true, invited users receive an email containing an accept link. Requires that the invited user has a verified email address.

### Response (200)

```json
{
  "enabled": true,
  "organization_limit": 10,
  "membership_limit": 100,
  "creator_role": "owner",
  "send_invitation_email": false
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/plugins/organization" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateNeonAuthOrganizationPlugin({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon neon-auth config organization update
```

### Console

Console path: Projects → Auth → Plugins

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
