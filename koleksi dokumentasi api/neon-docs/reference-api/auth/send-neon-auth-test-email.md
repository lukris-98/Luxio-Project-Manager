---
operationId: "sendNeonAuthTestEmail"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/auth/send_test_email"
tag: "auth"
stability: "beta"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Authentication / Send test email

## POST /projects/{project_id}/branches/{branch_id}/auth/send_test_email

Sends a test email using the SMTP server settings supplied in the request body to verify connectivity and credentials.
The request body must include the full SMTP server settings
(`host`, `port`, `username`, `password`, `sender_email`, `sender_name`) and the `recipient_email` address.

Deprecated: to test a branch's already-saved configuration, use `sendNeonAuthEmailProviderTest`, which
reuses the stored SMTP password server-side so the caller never has to re-supply (or be able to read) it.
This endpoint remains available for testing an unsaved full configuration and for non-Better-Auth providers.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `host` (string, required)
  Hostname of the email server.
- `port` (integer, required)
  TCP port of the SMTP server. Common values: 25 (SMTP), 465 (SMTPS), 587 (submission).
- `username` (string, required)
  Username for authenticating with the SMTP server.
- `password` (string, required)
  Password for authenticating with the SMTP server.
- `sender_email` (string, required)
  Email address used as the From address on outgoing auth emails.
- `sender_name` (string, required)
  Display name shown as the sender in outgoing emails.
- `recipient_email` (string, required, format: email)
  The email address to send the test email to.

### Response (200)

```json
{
  "success": false,
  "error_message": "Failed to send email to te****@example.com: getaddrinfo ENOTFOUND smtp.example.com"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/send_test_email" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.sendNeonAuthTestEmail({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon neon-auth config email-provider test
```

### Console

Console path: Projects → Auth → Configuration

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
