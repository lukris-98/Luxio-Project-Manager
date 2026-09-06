# Users

These endpoints return information about the currently authenticated user: your user ID, email, and organization memberships. They act on the identity tied to the API key, not on a specific project.

See [Manage your account](/docs/manage/accounts) for account settings and profile management.

---

> API Reference / Users / Retrieve current user details

## GET /users/me

Retrieves information about the currently authenticated Neon user,
including account identifiers, plan details, and linked auth accounts.


### Response (200)

```json
{
  "active_seconds_limit": 0,
  "auth_accounts": [
    {
      "email": "jane.doe@example.com",
      "image": "https://example.com/avatar.png",
      "login": "jane-doe",
      "name": "Jane",
      "provider": "google"
    },
    {
      "email": "jane.doe@example.com",
      "image": "https://example.com/avatar.png",
      "login": "jane-doe",
      "name": "Jane",
      "provider": "keycloak"
    },
    {
      "email": "jane.doe@example.com",
      "image": "https://example.com/avatar.png",
      "login": "jane-doe",
      "name": "Jane",
      "provider": "vercelmp"
    }
  ],
  "email": "jane.doe@example.com",
  "id": "00000000-0000-0000-0000-000000000000",
  "image": "https://example.com/avatar.png",
  "login": "jane-doe",
  "name": "Jane",
  "last_name": "Doe",
  "projects_limit": 0,
  "branches_limit": 0,
  "max_autoscaling_limit": 0,
  "plan": "free"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/users/me" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getCurrentUserInfo({
  client: neon.client
});
```

```bash
# neonctl
neon me
```

### MCP

Tool: `list_projects`

List Neon projects in your account. Do not use for projects shared with you (use `list_shared_projects` instead). Supports optional `search` (filter by name or ID) and `limit` (default 10) parameters.

- `cursor` (string, optional)
  Specify the cursor value from the previous response to retrieve the next batch of projects.
- `limit` (number, optional, default: 10)
  Specify a value from 1 to 400 to limit number of projects in the response.
- `search` (string, optional)
  Search by project name or id. You can specify partial name or id values to filter results.
- `org_id` (string, optional)
  Search for projects by org_id.

### Console

Console path: Account settings → Profile

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

> API Reference / Users / List organizations for the current user

## GET /users/me/organizations

Retrieves the organizations that the currently authenticated user belongs to.

When called with an organization- or project-scoped API key (which is not
tied to a user), this returns the single organization that owns the key.


### Response (200)

```json
{
  "organizations": [
    {
      "id": "org-mossy-fern-111111",
      "name": "My Other Org",
      "handle": "my-other-org-org-mossy-fern-111111",
      "plan": "free",
      "created_at": "2025-01-15T10:30:00Z",
      "managed_by": "vercel",
      "updated_at": "2025-01-15T11:00:00Z",
      "require_mfa": false
    },
    {
      "id": "org-coral-tide-222222",
      "name": "My Backup Org",
      "handle": "my-backup-org-org-coral-tide-222222",
      "plan": "free",
      "created_at": "2025-01-15T11:30:00Z",
      "managed_by": "console",
      "updated_at": "2025-01-15T11:30:00Z",
      "require_mfa": false
    },
    {
      "id": "org-pebble-stone-333333",
      "name": "My Archived Org",
      "handle": "my-archived-org-org-pebble-stone-333333",
      "plan": "free",
      "created_at": "2025-01-15T12:00:00Z",
      "managed_by": "console",
      "updated_at": "2025-01-15T12:30:00Z",
      "require_mfa": false
    },
    {
      "id": "org-spring-garden-12345",
      "name": "My Org",
      "handle": "my-org-org-spring-garden-12345",
      "plan": "scale",
      "created_at": "2025-01-15T13:00:00Z",
      "managed_by": "console",
      "updated_at": "2025-01-15T13:30:00Z",
      "require_mfa": false
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/users/me/organizations" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getCurrentUserOrganizations({
  client: neon.client
});
```

```bash
# neonctl
neon orgs list
```

### MCP

Tool: `list_organizations`

List all organizations the current user belongs to. Supports optional `search` parameter to filter by name or ID.

- `search` (string, optional)
  Search organizations by name or ID. You can specify partial name or ID values to filter results.

### Console

Console path: Account settings → Profile

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

> API Reference / Users / Transfer projects from personal account to organization

## POST /users/me/projects/transfer

Deprecated. Personal accounts have been migrated to organizations, so this operation no longer applies. Removal scheduled for July 1, 2026.


### Request body

- `destination_org_id` (string, required)
  The destination organization identifier
- `project_ids` (array, required)
  The list of projects ids to transfer. Maximum of 400 project ids

### Response (200)


### Code examples

```bash
curl "https://console.neon.tech/api/v2/users/me/projects/transfer" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.transferProjectsFromUserToOrg({
  client: neon.client
});
```

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

> API Reference / Users / Retrieve request authentication details

## GET /auth

Returns authentication details for the credentials used in the request,
including the credential type (API key, Bearer token, or OAuth session)
and the associated identity.


### Response (200)

- `account_id` (string, optional)
  The ID of the account associated with this authentication record.
- `auth_method` (string, optional)
  Authentication method used for the request:
  - `keycloak`: Keycloak identity provider authentication.
  - `session_cookie`: Browser session cookie authentication.
  - `api_key_user`: API key scoped to a user account.
  - `api_key_org`: API key scoped to an organization.
  - `oauth`: OAuth-based authentication.
  
  Possible values: `keycloak`, `session_cookie`, `api_key_user`, `api_key_org`, `oauth`
- `auth_data` (string, optional)

### Code examples

```bash
curl "https://console.neon.tech/api/v2/auth" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getAuthDetails({
  client: neon.client
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
