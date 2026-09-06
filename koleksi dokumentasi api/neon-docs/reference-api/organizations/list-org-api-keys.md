---
operationId: "listOrgApiKeys"
method: "GET"
path: "/organizations/{org_id}/api_keys"
tag: "organizations"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Organizations / List organization API keys

## GET /organizations/{org_id}/api_keys

Retrieves the API keys for the specified organization.
The response does not include API key tokens. A token is only provided when creating an API key.
API keys can also be managed in the Neon Console.
For more information, see [Manage API keys](https://neon.com/docs/manage/api-keys/).


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Response (200)

```json
[
  {
    "id": 1000000,
    "name": "production-backend",
    "created_at": "2025-01-15T10:30:00Z",
    "created_by": {
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "Jane Doe",
      "image": "https://example.com/avatar.png"
    },
    "last_used_at": null,
    "last_used_from_addr": ""
  },
  {
    "id": 1000001,
    "name": "ci-cd-pipeline",
    "created_at": "2025-01-15T10:30:00Z",
    "created_by": {
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "Jane Doe",
      "image": "https://example.com/avatar.png"
    },
    "last_used_at": null,
    "last_used_from_addr": ""
  },
  {
    "id": 1000002,
    "name": "local-development",
    "created_at": "2025-01-15T11:00:00Z",
    "created_by": {
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "Jane Doe",
      "image": "https://example.com/avatar.png"
    },
    "last_used_at": null,
    "last_used_from_addr": ""
  }
]
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/api_keys" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listOrgApiKeys({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

```bash
# neonctl
neon api-keys list
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
