---
operationId: "getNeonAuthPluginConfigs"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/auth/plugins"
tag: "auth"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Authentication / Retrieve Neon Auth plugin configurations

## GET /projects/{project_id}/branches/{branch_id}/auth/plugins

Returns all plugin configurations for Neon Auth in a single response.
This endpoint aggregates organization, email provider, email and password,
OAuth providers, and localhost settings.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Response (200)

```json
{
  "organization": {
    "enabled": true,
    "organization_limit": 10,
    "membership_limit": 100,
    "creator_role": "owner",
    "send_invitation_email": false
  },
  "magic_link": {
    "enabled": false,
    "expires_in": 5,
    "disable_sign_up": false
  },
  "phone_number": {
    "enabled": false,
    "otp_expires_in": 300
  },
  "email_provider": {
    "type": "shared"
  },
  "email_and_password": {
    "enabled": true,
    "email_verification_method": "otp",
    "require_email_verification": false,
    "auto_sign_in_after_verification": true,
    "send_verification_email_on_sign_up": false,
    "send_verification_email_on_sign_in": false,
    "disable_sign_up": false
  },
  "oauth_providers": [
    {
      "id": "google",
      "type": "shared"
    }
  ],
  "allow_localhost": true
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/plugins" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getNeonAuthPluginConfigs({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
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
