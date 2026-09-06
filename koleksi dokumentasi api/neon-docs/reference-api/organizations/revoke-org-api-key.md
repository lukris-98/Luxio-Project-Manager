---
operationId: "revokeOrgApiKey"
method: "DELETE"
path: "/organizations/{org_id}/api_keys/{key_id}"
tag: "organizations"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Organizations / Revoke organization API key

## DELETE /organizations/{org_id}/api_keys/{key_id}

Revokes the specified organization API key.
An API key that is no longer needed can be revoked.
This action cannot be reversed.
API keys can also be managed in the Neon Console.
See [Manage API keys](https://neon.com/docs/manage/api-keys/).


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `key_id` (integer, path, required)
  The API key ID

### Response (200)

```json
{
  "id": 1000000,
  "name": "service-key-58",
  "created_at": "2025-01-15T10:30:00Z",
  "created_by": "00000000-0000-0000-0000-000000000000",
  "last_used_at": null,
  "last_used_from_addr": "",
  "revoked": true
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/api_keys/$KEY_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.revokeOrgApiKey({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    key_id: process.env.KEY_ID
  }
});
```

```bash
# neonctl
neon api-keys revoke <id>
```

### Console

Console path: Organization → Settings → API keys

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
