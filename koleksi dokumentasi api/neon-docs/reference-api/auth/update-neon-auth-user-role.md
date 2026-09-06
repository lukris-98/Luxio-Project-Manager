---
operationId: "updateNeonAuthUserRole"
method: "PUT"
path: "/projects/{project_id}/branches/{branch_id}/auth/users/{auth_user_id}/role"
tag: "auth"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Authentication / Update auth user role

## PUT /projects/{project_id}/branches/{branch_id}/auth/users/{auth_user_id}/role

Updates the role of a user in the Neon Auth user directory for the specified branch.
The role controls the user's level of access within the Neon Auth integration.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `auth_user_id` (string, path, required)
  The Neon user ID

### Request body

- `roles` (array, required)
  Roles to assign to the user in the Neon Auth (Better Auth) directory. `user` and `admin` are the built-in roles; custom role strings are also supported.

### Response (200)

```json
{
  "id": "00000000-0000-0000-0000-000000000000"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/users/$AUTH_USER_ID/role" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateNeonAuthUserRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    auth_user_id: process.env.AUTH_USER_ID
  }
});
```

```bash
# neonctl
neon neon-auth user set-role <user-id>
```

### Console

Console path: Projects → Auth → Users

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
