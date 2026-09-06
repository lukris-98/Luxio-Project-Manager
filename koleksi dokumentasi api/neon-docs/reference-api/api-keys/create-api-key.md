---
operationId: "createApiKey"
method: "POST"
path: "/api_keys"
tag: "api-keys"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / API Keys / Create API key

## POST /api_keys

Creates an API key.
The `key_name` is a user-specified name for the key.
Returns an `id` and `key`; the `key` is a randomly generated, 64-bit token required to access the Neon API.
Store the key securely — it is only returned once.
API keys can also be managed in the Neon Console.
See [Manage API keys](https://neon.com/docs/manage/api-keys/).


### Request body

- `key_name` (string, required)
  A user-specified API key name. This value is required when creating an API key.

```json
{
  "key_name": "mykey"
}
```

### Response (200)

```json
{
  "id": 1000000,
  "key": "napi_examplekey000000000000000000000000000000000000000000000000",
  "name": "service-key-49",
  "created_at": "2025-01-15T10:30:00Z",
  "created_by": "00000000-0000-0000-0000-000000000000"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/api_keys" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key_name":"mykey"}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createApiKey({
  client: neon.client,
  body: {
    key_name: "mykey"
  }
});
```

```bash
# neonctl
neon api-keys create
```

### Console

Console path: Account settings → API keys

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
