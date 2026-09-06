---
operationId: "updateNeonAuthOauthProvider"
method: "PATCH"
path: "/projects/{project_id}/auth/oauth_providers/{oauth_provider_id}"
tag: "auth-legacy"
interfaces: ["api", "sdk"]
---
> API Reference / Legacy Auth / Update OAuth provider

## PATCH /projects/{project_id}/auth/oauth_providers/{oauth_provider_id}

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/oauth_providers/{oauth_provider_id}` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `oauth_provider_id` (string, path, required)
  The OAuth provider ID

### Request body

- `client_id` (string, optional)
  The OAuth client ID registered with the provider. Omit to keep the currently configured value.
- `client_secret` (string, optional)
  OAuth client secret for the provider. Omit to leave the existing secret unchanged.
- `microsoft_tenant_id` (string, optional)
  The tenant ID scoping the Microsoft OAuth provider. Supply this field when the provider type is microsoft; it has no effect for other provider types.

### Response (200)

- `id` (string, optional)
  The OAuth provider's ID.
  Possible values: `google`, `github`, `microsoft`, `vercel`
- `type` (string, optional)
  OAuth provider key type. `standard` uses your own OAuth credentials. `shared` uses Neon-managed keys intended for development only; they display Neon branding on the OAuth consent screen and must not be used in production.
  Possible values: `standard`, `shared`
- `client_id` (string, optional)
  Public identifier for the OAuth application, issued by the provider when the application is registered.
- `client_secret` (string, optional)
  OAuth client secret for the provider.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/oauth_providers/$OAUTH_PROVIDER_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateNeonAuthOauthProvider({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    oauth_provider_id: process.env.OAUTH_PROVIDER_ID
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
