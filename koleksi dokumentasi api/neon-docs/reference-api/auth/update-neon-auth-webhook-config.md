---
operationId: "updateNeonAuthWebhookConfig"
method: "PUT"
path: "/projects/{project_id}/branches/{branch_id}/auth/webhooks"
tag: "auth"
interfaces: ["api", "sdk", "cli"]
---
> API Reference / Authentication / Update Neon Auth webhook configuration

## PUT /projects/{project_id}/branches/{branch_id}/auth/webhooks

Updates the webhook configuration for the specified branch's Neon Auth integration.
Webhooks notify an external endpoint when auth events occur, such as user creation or sign-in.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `enabled` (boolean, required)
  Whether the webhook is active.
- `webhook_url` (string, optional)
  Destination URL that receives webhook event payloads.
- `enabled_events` (array, optional)
  Event types that trigger this webhook. Covers user lifecycle, email/OTP delivery, organization invitations, and phone verification events; see the enum for exact values.
- `timeout_seconds` (integer, optional)
  Maximum time, in seconds, to wait for a response from the webhook endpoint.
  Default: `5`

### Response (200)

```json
{
  "enabled": true,
  "enabled_events": [],
  "timeout_seconds": 5
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/webhooks" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateNeonAuthWebhookConfig({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon neon-auth config webhook update
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
