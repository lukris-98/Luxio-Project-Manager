# Credentials

Scoped credentials are branch-anchored tokens for workloads that can't use a user session, such as CI jobs, servers, and S3 clients. One credential API serves multiple Neon services, and the scopes you request determine what a credential can do. Each service documents its own scopes.

The create response returns `api_token` and `s3_secret_access_key` exactly once, and they can't be retrieved again; list responses return metadata only. To rotate, create a new credential, update your environment, then revoke the old one.

A credential is valid on the branch it was created on and any branch descended from it, but not on branches outside that lineage.

Scoped credentials are in beta. See [Object Storage authentication](/docs/storage/authentication) and [AI Gateway authentication](/docs/ai-gateway/authentication) for scope details and client setup.

---

> API Reference / Credentials / List credentials on the branch

## GET /projects/{project_id}/branches/{branch_id}/credentials

Returns metadata for customer-issued credentials on the branch.
Secrets are never included.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Response (200)

```json
{
  "credentials": [
    {
      "token_id": "<token_id>",
      "token_id_short": "<token_id_short>",
      "name": "ai-gateway-client",
      "scopes": [
        "ai_gateway:invoke"
      ],
      "principal_type": "user",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "token_id": "<token_id>",
      "token_id_short": "<token_id_short>",
      "name": "storage-writer",
      "scopes": [
        "storage:read",
        "storage:write"
      ],
      "principal_type": "user",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "token_id": "<token_id>",
      "token_id_short": "<token_id_short>",
      "name": "storage-reader",
      "scopes": [
        "storage:read"
      ],
      "principal_type": "user",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/credentials" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listCredentials({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
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

---

> API Reference / Credentials / Issue a scoped credential on the branch

## POST /projects/{project_id}/branches/{branch_id}/credentials

Issues a new scoped service credential anchored to the specified
branch. The response carries `api_token` and `s3_secret_access_key`
exactly once — they are not stored server-side.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `name` (string, optional)
  Free-form customer label for the credential.
- `scopes` (array, required)
- `principal_type` (string, required)
  Principal type for the credential. Only `user` is customer-managed
  and accepted here. `function` and `system` credentials are
  platform-internal (e.g. function-serve auto-mint, presign signer)
  and are never issued through the customer-facing API.
  
  Possible values: `user`

### Response (201)

```json
{
  "token_id": "<token_id>",
  "token_id_short": "<token_id_short>",
  "name": "my-credential",
  "api_token": "<api_token>",
  "s3_secret_access_key": "<s3_secret_access_key>",
  "scopes": [
    "storage:read"
  ],
  "branch_id": "br-young-forest-a5b6c7d8",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/credentials" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createCredential({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
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

---

> API Reference / Credentials / Revoke a credential

## DELETE /projects/{project_id}/branches/{branch_id}/credentials/{token_id}

Soft-deletes the credential.  Idempotent.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `token_id` (string, path, required)
  The opaque credential id (e.g. nak_live_<32hex>).

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/credentials/$TOKEN_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.revokeCredential({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    token_id: process.env.TOKEN_ID
  }
});
```

### Errors

**404**
Credential not found
- `request_id` (string, optional)
  Unique identifier for the request, useful for debugging.
  You can set this value manually by including an `X-Request-ID` header in the request. If not provided, the value will be generated automatically.
  
- `code` (string, required)
  Machine-readable code classifying the error type. See `message` for a human-readable explanation.
  Default: ``
- `message` (string, required)
  Error message

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
