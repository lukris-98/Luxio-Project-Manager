# Organizations

An organization groups projects under shared billing, access control, and API keys. Organizations have two roles: **Admin** (full control over the org and its projects) and **Member** (access to all projects, but cannot modify org settings).

Use these endpoints from automation that manages team membership, handles invitations, or configures org-level infrastructure. Direct project operations (creating branches, querying databases) use the project-level endpoints regardless of whether the project belongs to an org.

Some endpoints require the admin role. Member-level tokens can read org state but cannot modify members or billing settings.

You can also list your organizations from the CLI with [`neon orgs`](/docs/cli/orgs).

See [Organizations](/docs/manage/organizations) for full role permissions and plan limits.

---

> API Reference / Organizations / Retrieve organization details

## GET /organizations/{org_id}

Retrieves details for the specified organization, including its name, plan, and configuration.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Response (200)

```json
{
  "id": "org-spring-garden-12345",
  "name": "My Org",
  "handle": "my-org-org-spring-garden-12345",
  "plan": "scale",
  "created_at": "2025-01-15T10:30:00Z",
  "managed_by": "console",
  "updated_at": "2025-01-15T11:00:00Z",
  "require_mfa": false
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganization({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

### MCP

Tool: `list_organizations`

List all organizations the current user belongs to. Supports optional `search` parameter to filter by name or ID.

- `search` (string, optional)
  Search organizations by name or ID. You can specify partial name or ID values to filter results.

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

---

> API Reference / Organizations / Create organization API key

## POST /organizations/{org_id}/api_keys

Creates an API key for the specified organization.
The `key_name` is a user-specified name for the key.
Returns an `id` and `key`; the `key` is a randomly generated, 64-bit token required to access the Neon API.
Store the key securely — it is only returned once.
API keys can also be managed in the Neon Console.
See [Manage API keys](https://neon.com/docs/manage/api-keys/).


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Request body

- `key_name` (string, required)
  A user-specified API key name. This value is required when creating an API key.
- `project_id` (string, optional)
  If set, the API key can access only this project

```json
{
  "key_name": "orgkey"
}
```

### Response (200)

```json
{
  "id": 1000000,
  "key": "napi_examplekey000000000000000000000000000000000000000000000000",
  "name": "service-key-55",
  "created_at": "2025-01-15T10:30:00Z",
  "created_by": "00000000-0000-0000-0000-000000000000"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/api_keys" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key_name":"orgkey"}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createOrgApiKey({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  },
  body: {
    key_name: "orgkey"
  }
});
```

```bash
# neonctl
neon api-keys create
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

---

> API Reference / Organizations / Retrieve organization spending limit

## GET /organizations/{org_id}/billing/spending_limit

Returns the configured monthly spending limit for the specified organization.
`spending_limit_cents: null` indicates that no limit is currently set.
Available to organization members with read access on Launch and Scale plans only.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Response (200)

```json
{
  "spending_limit_cents": null
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/billing/spending_limit" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganizationSpendingLimit({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
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

> API Reference / Organizations / Set organization spending limit

## PUT /organizations/{org_id}/billing/spending_limit

Sets the monthly spending limit for the specified organization.
To remove a previously configured limit, send a DELETE request to this endpoint.
When a limit is configured, email notifications are sent at 80% and 100% of the limit.
Computes are not suspended when the limit is reached.
Available to organization admins on Launch and Scale plans only.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Request body

- `spending_limit_cents` (integer, required, format: int64)
  Monthly spending cap in cents. Must be positive. To remove a
  previously configured limit, send a DELETE request to the
  spending_limit endpoint — `0` and `null` are rejected here.
  The cap is alert-only: notifications fire at 80% and 100%, but
  computes are not suspended. Setting a cap below the period's
  already-accrued spend is permitted and will trigger the
  over-limit notification on the next worker run.
  

### Response (200)

- `spending_limit_cents` (integer, optional, format: int64)
  Monthly spending cap in cents. `null` indicates that no limit
  is currently configured.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/billing/spending_limit" \
  -X PUT \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.setOrganizationSpendingLimit({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

### Console

Console path: Organization → Billing → Spending limit

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

> API Reference / Organizations / Remove organization spending limit

## DELETE /organizations/{org_id}/billing/spending_limit

Removes the configured monthly spending limit for the specified organization.
Idempotent — removing an already-unset limit still succeeds.
Available to organization admins on Launch and Scale plans only.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Response (200)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/billing/spending_limit" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteOrganizationSpendingLimit({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

### Console

Console path: Organization → Billing → Spending limit

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

> API Reference / Organizations / List organization members

## GET /organizations/{org_id}/members

Retrieves a paginated list of members for the specified organization.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `sort_by` (string, query, optional)
  Sort the members by the specified field. Defaults to `joined_at`.
  Default: `joined_at`
- `cursor` (string, query, optional)
  A cursor to use in pagination. A cursor defines your place in the data list. Include `response.pagination.next` in subsequent API calls to fetch next page of the list.
- `sort_order` (string, query, optional)
  Defines the sorting order of entities.
  Default: `desc`
- `limit` (integer, query, optional)
  The maximum number of members to return in the response

### Response (200)

```json
{
  "members": [
    {
      "member": {
        "id": "00000000-0000-0000-0000-000000000000",
        "user_id": "00000000-0000-0000-0000-000000000000",
        "org_id": "org-spring-garden-12345",
        "role": "member",
        "joined_at": "2025-01-15T10:30:00Z"
      },
      "user": {
        "email": "alex@example.com",
        "has_mfa": false
      }
    },
    {
      "member": {
        "id": "00000000-0000-0000-0000-000000000000",
        "user_id": "00000000-0000-0000-0000-000000000000",
        "org_id": "org-spring-garden-12345",
        "role": "admin",
        "joined_at": "2025-01-15T11:00:00Z"
      },
      "user": {
        "email": "jane.doe@example.com",
        "has_mfa": false
      }
    }
  ],
  "pagination": {
    "sort_by": "joined_at",
    "sort_order": "desc"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/members" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganizationMembers({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

### Console

Console path: Organization → People → Members

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

> API Reference / Organizations / Retrieve organization member details

## GET /organizations/{org_id}/members/{member_id}

Retrieves information about the specified organization member.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `member_id` (string, path, required)
  The Neon organization member ID

### Response (200)

```json
{
  "id": "d57833f2-d308-4ede-9d2e-468d9d013d1b",
  "user_id": "b107d689-6dd2-4c9a-8b9e-0b25e457cf56",
  "org_id": "my-organization-morning-bread-81040908",
  "role": "admin",
  "joined_at": "2024-02-23T17:42:25Z"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/members/$MEMBER_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganizationMember({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    member_id: process.env.MEMBER_ID
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

> API Reference / Organizations / Update role for organization member

## PATCH /organizations/{org_id}/members/{member_id}

Updates the role of an existing member in the specified organization.
The requested role must be valid for the organization.
Only organization admins can call this endpoint.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `member_id` (string, path, required)
  The Neon organization member ID

### Request body

- `role` (string, required)
  Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`

```json
{
  "role": "member"
}
```

### Response (200)

- `id` (string, optional, format: uuid)
  The organization member's ID.
- `user_id` (string, optional, format: uuid)
  The Neon user ID.
- `org_id` (string, optional)
  The Neon organization ID. Returned as `id` from `GET /users/me/organizations`.
- `role` (string, optional)
  Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
- `joined_at` (string, optional, format: date-time)
  Timestamp when the user joined the organization.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/members/$MEMBER_ID" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":"member"}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateOrganizationMember({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    member_id: process.env.MEMBER_ID
  },
  body: {
    role: "member"
  }
});
```

### Console

Console path: Organization → People → Members

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

> API Reference / Organizations / Remove organization member

## DELETE /organizations/{org_id}/members/{member_id}

Removes the specified member from the organization.
Only organization admins can perform this action.
The last admin in an organization cannot be removed.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `member_id` (string, path, required)
  The Neon organization member ID

### Response (200)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/members/$MEMBER_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.removeOrganizationMember({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    member_id: process.env.MEMBER_ID
  }
});
```

### Console

Console path: Organization → People → Members

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

> API Reference / Organizations / List organization invitations

## GET /organizations/{org_id}/invitations

Retrieves pending and accepted invitations for the specified organization.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Response (200)

```json
{
  "invitations": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/invitations" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganizationInvitations({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

### Console

Console path: Organization → People → Pending invites

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

> API Reference / Organizations / Create organization invitations

## POST /organizations/{org_id}/invitations

Creates invitations for a specific organization.
If the invited user has an existing account, they automatically join as a member.
If they don't yet have an account, they are invited to create one, after which they become a member.
Each invited user receives an email notification.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Request body

- `invitations` (array, required)
  Invitations to create for the organization.
  - `email` (string, required, format: email)
    Email address of the person to invite to the organization.
  - `role` (string, required)
    Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
    Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`

```json
{
  "invitations": [
    {
      "email": "invited-user@email.com",
      "role": "member"
    }
  ]
}
```

### Response (200)

- `invitations` (array, optional)
  List of pending invitations for the organization.
  - `id` (string, required, format: uuid)
    The invitation ID.
  - `email` (string, required, format: email)
    Email of the invited user
  - `org_id` (string, required)
    Organization id as it is stored in Neon
  - `invited_by` (string, required, format: uuid)
    UUID for the user_id who extended the invitation
  - `invited_at` (string, required, format: date-time)
    Timestamp when the invitation was created
  - `role` (string, required)
    Organization member's role. `admin`: full administrative access. `editor` (and its legacy alias `member`): standard access governed by project permissions. `viewer` and `collaborator`: additional scoped project roles. Some values may not be available for all organizations.
    Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/invitations" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"invitations":[{"email":"invited-user@email.com","role":"member"}]}'
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createOrganizationInvitations({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  },
  body: {
    invitations: [
      {
        email: "invited-user@email.com",
        role: "member"
      }
    ]
  }
});
```

### Console

Console path: Organization → People

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

> API Reference / Organizations / Transfer projects between organizations

## POST /organizations/{source_org_id}/projects/transfer

Transfers selected projects, identified by their IDs, from your organization to another specified organization.


### Parameters

- `source_org_id` (string, path, required)
  The Neon organization ID (source org, which currently owns the project)

### Request body

- `destination_org_id` (string, required)
  The destination organization identifier
- `project_ids` (array, required)
  The list of projects ids to transfer. Maximum of 400 project ids

### Response (200)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$SOURCE_ORG_ID/projects/transfer" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.transferProjectsFromOrgToOrg({
  client: neon.client,
  path: {
    source_org_id: process.env.SOURCE_ORG_ID
  }
});
```

### Console

Console path: Organization → Settings → Transfer projects

### Errors

**406**
Transfer failed. The target organization has too many projects or an incompatible plan. Reduce projects or upgrade the target organization.
- `limits` (array, required)
  Plan limits that were not satisfied by the request.
  - `name` (string, required)
    Identifier of the unsatisfied limit. Possible values are:
    - subscription_type
    - projects_count
    - project_region
    
  - `expected` (string, required)
    Required value for the limit named by `name`. Compare with `actual` to determine the shortfall.
  - `actual` (string, required)
    Current value of the named limit, which does not satisfy the required `expected` value.

**422**
Transfer failed. Projects with active integrations (for example, GitHub or Vercel) cannot be transferred.
- `projects` (array, required)
  Projects that have the requested integration, each including the project details and associated integration metadata.
  - `id` (string, required)
    The Neon project ID. Use as the `project_id` path parameter in other endpoints.
  - `integration` (string, required)
    Name of the external integration associated with the project.

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

> API Reference / Organizations / List VPC endpoints across all regions

## GET /organizations/{org_id}/vpc/vpc_endpoints

Retrieves the list of VPC endpoints for the specified Neon organization across all regions.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID

### Response (200)

```json
{
  "endpoints": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/vpc/vpc_endpoints" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listOrganizationVpcEndpointsAllRegions({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID
  }
});
```

### Console

Console path: Organization → Settings → Private Networking

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

> API Reference / Organizations / List VPC endpoints

## GET /organizations/{org_id}/vpc/region/{region_id}/vpc_endpoints

Retrieves the list of VPC endpoints for the specified Neon organization.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `region_id` (string, path, required)
  The Neon region ID

### Response (200)

```json
{
  "endpoints": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/vpc/region/$REGION_ID/vpc_endpoints" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listOrganizationVpcEndpoints({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    region_id: process.env.REGION_ID
  }
});
```

```bash
# neonctl
neon vpc endpoint list --org-id <id> --region-id <region_id>
```

### Console

Console path: Organization → Settings → Private Networking

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

> API Reference / Organizations / Retrieve VPC endpoint details

## GET /organizations/{org_id}/vpc/region/{region_id}/vpc_endpoints/{vpc_endpoint_id}

Retrieves the current state and configuration details of a specified VPC endpoint.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `region_id` (string, path, required)
  The Neon region ID.
  Azure regions are currently not supported.
  
- `vpc_endpoint_id` (string, path, required)
  The VPC endpoint ID

### Response (200)

- `vpc_endpoint_id` (string, optional)
  Cloud provider identifier for the VPC endpoint.
- `label` (string, optional)
  A descriptive label for the VPC endpoint
- `state` (string, optional)
  The current state of the VPC endpoint. `new` means the endpoint has just been configured and is pending acceptance by Neon. `accepted` means the VPC connection has been accepted by Neon.
  
- `num_restricted_projects` (integer, optional)
  The number of projects that are restricted to use this VPC endpoint.
  
- `example_restricted_projects` (array, optional)
  A list of example projects that are restricted to use this VPC endpoint.
  There are at most 3 projects in the list, even if more projects are restricted.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/vpc/region/$REGION_ID/vpc_endpoints/$VPC_ENDPOINT_ID" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getOrganizationVpcEndpointDetails({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    region_id: process.env.REGION_ID,
    vpc_endpoint_id: process.env.VPC_ENDPOINT_ID
  }
});
```

```bash
# neonctl
neon vpc endpoint status <vpc_endpoint_id> --org-id <id> --region-id <region_id>
```

### Console

Console path: Organization → Settings → Private Networking

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

> API Reference / Organizations / Assign or update VPC endpoint

## POST /organizations/{org_id}/vpc/region/{region_id}/vpc_endpoints/{vpc_endpoint_id}

Assigns a VPC endpoint to a Neon organization or updates its existing assignment.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `region_id` (string, path, required)
  The Neon region ID.
  Azure regions are currently not supported.
  
- `vpc_endpoint_id` (string, path, required)
  The VPC endpoint ID

### Request body

- `label` (string, required)
  Human-readable name for the VPC endpoint assignment, used to identify it within the organization.

### Response (200)

Assigned the VPC endpoint to the specified Neon organization

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/vpc/region/$REGION_ID/vpc_endpoints/$VPC_ENDPOINT_ID" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.assignOrganizationVpcEndpoint({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    region_id: process.env.REGION_ID,
    vpc_endpoint_id: process.env.VPC_ENDPOINT_ID
  }
});
```

```bash
# neonctl
neon vpc endpoint assign <vpc_endpoint_id> --org-id <id> --region-id <region_id>
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

> API Reference / Organizations / Delete VPC endpoint

## DELETE /organizations/{org_id}/vpc/region/{region_id}/vpc_endpoints/{vpc_endpoint_id}

Deletes the VPC endpoint from the specified Neon organization.
If you delete a VPC endpoint from a Neon organization, that VPC endpoint cannot
be added back to the Neon organization.


### Parameters

- `org_id` (string, path, required)
  The Neon organization ID
- `region_id` (string, path, required)
  The Neon region ID.
  Azure regions are currently not supported.
  
- `vpc_endpoint_id` (string, path, required)
  The VPC endpoint ID

### Response (200)

Deleted the VPC endpoint from the specified Neon organization

### Code examples

```bash
curl "https://console.neon.tech/api/v2/organizations/$ORG_ID/vpc/region/$REGION_ID/vpc_endpoints/$VPC_ENDPOINT_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteOrganizationVpcEndpoint({
  client: neon.client,
  path: {
    org_id: process.env.ORG_ID,
    region_id: process.env.REGION_ID,
    vpc_endpoint_id: process.env.VPC_ENDPOINT_ID
  }
});
```

```bash
# neonctl
neon vpc endpoint remove <vpc_endpoint_id> --org-id <id> --region-id <region_id>
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
