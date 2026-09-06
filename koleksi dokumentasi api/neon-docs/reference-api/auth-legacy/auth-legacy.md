# Legacy Auth

> **Deprecated:** These endpoints are from a previous version of Neon Auth. For new integrations, use the [Authentication](/docs/reference/api/auth) endpoints instead.

These endpoints remain available for existing integrations. See [Neon Auth](/docs/auth/overview) for current documentation.

---

> API Reference / Legacy Auth / Create Neon Auth integration

## POST /projects/auth/create

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth` instead. Removal scheduled for March 1, 2026.
Use this endpoint if the frontend integration flow can't be used.


### Request body

- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `project_id` (string, required)
  The Neon project ID. Returned as `id` from `GET /projects`.
- `branch_id` (string, required)
  The Neon branch ID. Returned as `id` from `GET /projects/{project_id}/branches`.
- `database_name` (string, optional)
  Name of the database to associate with the Neon Auth integration. When omitted, the integration uses the project's default database.
- `role_name` (string, optional, deprecated)
  Deprecated. The database role for the auth integration. Omit this field; it is ignored.

### Response (201)

- `auth_provider` (string, optional)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `auth_provider_project_id` (string, optional)
  Project ID assigned by the auth provider for this integration.
- `pub_client_key` (string, optional)
  Publishable SDK key from the auth provider. Populated only for Stack Auth (deprecated); empty for Better Auth.
- `secret_server_key` (string, optional)
  Secret server-side SDK key from the auth provider. Populated only for Stack Auth (deprecated); empty for Better Auth. Treat as a credential.
- `jwks_url` (string, optional)
  URL of the provider's JWKS endpoint used to verify JWTs.
- `schema_name` (string, optional)
  Postgres schema containing the auth integration tables. Defaults to `neon_auth`.
- `table_name` (string, optional)
  Postgres table in the integration schema where synced user records are stored.
- `base_url` (string, optional)
  Base URL of the Neon Auth service for this integration. Set as the NEON_AUTH_BASE_URL environment variable in your application.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/auth/create" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createNeonAuthIntegration({
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

---

> API Reference / Legacy Auth / List trusted redirect URI domains

## GET /projects/{project_id}/auth/domains

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/domains` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

- `domains` (array, optional)
  Domains permitted as redirect URI targets in the whitelist.
  - `domain` (string, required)
    Allowed redirect URI domain for the auth provider.
  - `auth_provider` (string, required)
    Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
    Possible values: `mock`, `stack`, `better_auth`

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/domains" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listNeonAuthRedirectUriWhitelistDomains({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Legacy Auth / Add trusted redirect URI domain

## POST /projects/{project_id}/auth/domains

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/domains` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `domain` (string, required, format: uri)
  URI to add to the redirect URI allowlist for the auth provider.
- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`

### Response (201)

Added the domain to the redirect_uri whitelist

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/domains" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.addNeonAuthDomainToRedirectUriWhitelist({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Legacy Auth / Delete trusted redirect URI domain

## DELETE /projects/{project_id}/auth/domains

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/domains` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `domains` (array, required)
  Domain names to remove from the redirect URI whitelist for the specified auth provider.
  - `domain` (string, required, format: uri)
    URI to remove from the redirect URI whitelist.

### Response (200)

Deleted the domain from the redirect_uri whitelist

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/domains" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteNeonAuthDomainFromRedirectUriWhitelist({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Legacy Auth / Create Auth Provider SDK keys

## POST /projects/auth/keys

Generates SDK or API Keys for the auth provider. These might be called different things depending
on the auth provider you're using, but are generally used for setting up the frontend and backend SDKs.


### Request body

- `project_id` (string, required)
  The Neon project ID. Returned as `id` from `GET /projects`.
- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`

### Response (201)

- `auth_provider` (string, optional)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `auth_provider_project_id` (string, optional)
  Project ID assigned by the auth provider for this integration.
- `pub_client_key` (string, optional)
  Publishable SDK key from the auth provider. Populated only for Stack Auth (deprecated); empty for Better Auth.
- `secret_server_key` (string, optional)
  Secret server-side SDK key from the auth provider. Populated only for Stack Auth (deprecated); empty for Better Auth. Treat as a credential.
- `jwks_url` (string, optional)
  URL of the provider's JWKS endpoint used to verify JWTs.
- `schema_name` (string, optional)
  Postgres schema containing the auth integration tables. Defaults to `neon_auth`.
- `table_name` (string, optional)
  Postgres table in the integration schema where synced user records are stored.
- `base_url` (string, optional)
  Base URL of the Neon Auth service for this integration. Set as the NEON_AUTH_BASE_URL environment variable in your application.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/auth/keys" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createNeonAuthProviderSdkKeys({
  client: neon.client
});
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

---

> API Reference / Legacy Auth / Create new auth user

## POST /projects/auth/user

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/users` instead. Removal scheduled for March 1, 2026.
The user will be created in your neon_auth.users_sync table and automatically propagated to your auth project, whether Neon-managed or provider-owned.


### Request body

- `project_id` (string, required)
  The Neon project ID. Returned as `id` from `GET /projects`.
- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `email` (string, required, format: email)
  Email address of the new user.
- `name` (string, optional)
  Display name for the new user. When omitted, the created user has no display name.

### Response (201)

- `id` (string, optional)
  ID of newly created user

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/auth/user" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createNeonAuthNewUser({
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

---

> API Reference / Legacy Auth / Delete auth user

## DELETE /projects/{project_id}/auth/users/{auth_user_id}

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/users/{auth_user_id}` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `auth_user_id` (string, path, required)
  The Neon user ID

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/users/$AUTH_USER_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteNeonAuthUser({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    auth_user_id: process.env.AUTH_USER_ID
  }
});
```

### Console

Console path: Projects → Auth → Users

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

> API Reference / Legacy Auth / Transfer Neon-managed auth project to your own account

## POST /projects/auth/transfer_ownership

Transfers ownership of your Neon-managed auth project to your own auth provider account.


### Request body

- `project_id` (string, required)
  The Neon project ID. Returned as `id` from `GET /projects`.
- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`

### Response (200)

- `url` (string, optional)
  URL for completing the process of ownership transfer

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/auth/transfer_ownership" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.transferNeonAuthProviderProject({
  client: neon.client
});
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

---

> API Reference / Legacy Auth / List active integrations with auth providers

## GET /projects/{project_id}/auth/integrations

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth` instead. Removal scheduled for March 1, 2026.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

- `data` (array, optional)
  Neon Auth integrations configured for the project.
  - `auth_provider` (string, required)
    Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
    Possible values: `mock`, `stack`, `better_auth`
  - `auth_provider_project_id` (string, required)
    Project identifier assigned by the auth provider for this integration.
  - `branch_id` (string, required)
    The Neon branch ID. Returned as `id` from `GET /projects/{project_id}/branches`.
  - `db_name` (string, required)
    Name of the database used by the Neon Auth integration.
  - `created_at` (string, required, format: date-time)
    Timestamp when the Neon Auth integration was created, in RFC 3339 format (UTC).
  - `owned_by` (string, required)
    Owner of the auth provider project. `neon` means the project is created and managed by Neon on your behalf. `user` means the project was created in your own auth provider account and is self-managed.
    Possible values: `user`, `neon`
  - `transfer_status` (string, optional)
    Ownership transfer state for the auth provider project. `initiated` means a transfer was requested but not completed. `finished` means it completed successfully.
    Possible values: `initiated`, `finished`
  - `jwks_url` (string, required)
    URL of the provider's JWKS endpoint used to verify JWTs.
  - `base_url` (string, optional)
    Base URL of the Neon Auth service endpoint for this integration. Injected into the project environment as `NEON_AUTH_BASE_URL`.
  - `name` (string, optional)
    Application name shown in auth emails and communications. Defaults to the project name.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/integrations" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listNeonAuthIntegrations({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
  }
});
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

---

> API Reference / Legacy Auth / List OAuth providers

## GET /projects/{project_id}/auth/oauth_providers

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/oauth_providers` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

- `providers` (array, optional)
  OAuth providers configured for Neon Auth on the project.
  - `id` (string, required)
    The OAuth provider's ID.
    Possible values: `google`, `github`, `microsoft`, `vercel`
  - `type` (string, required)
    OAuth provider key type. `standard` uses your own OAuth credentials. `shared` uses Neon-managed keys intended for development only; they display Neon branding on the OAuth consent screen and must not be used in production.
    Possible values: `standard`, `shared`
  - `client_id` (string, optional)
    Public identifier for the OAuth application, issued by the provider when the application is registered.
  - `client_secret` (string, optional)
    OAuth client secret for the provider.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/oauth_providers" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listNeonAuthOauthProviders({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Legacy Auth / Add an OAuth provider

## POST /projects/{project_id}/auth/oauth_providers

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/oauth_providers` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `id` (string, required)
  OAuth provider to configure for Neon Auth. Known values: `google`, `github`, `microsoft`, `vercel`.
  
  Possible values: `google`, `github`, `microsoft`, `vercel`
- `client_id` (string, optional)
  The client ID issued by the OAuth provider for your application. Used to identify the application during the OAuth flow.
- `client_secret` (string, optional)
  OAuth client secret for the provider.
- `microsoft_tenant_id` (string, optional)
  Tenant ID for the Microsoft OAuth provider. Only relevant when the OAuth provider is Microsoft; omit or leave blank for other providers.

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
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/oauth_providers" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.addNeonAuthOauthProvider({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

---

> API Reference / Legacy Auth / Delete OAuth provider

## DELETE /projects/{project_id}/auth/oauth_providers/{oauth_provider_id}

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/oauth_providers/{oauth_provider_id}` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `oauth_provider_id` (string, path, required)
  The OAuth provider ID

### Response (200)

Deleted the OAuth provider from the project

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/oauth_providers/$OAUTH_PROVIDER_ID" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteNeonAuthOauthProvider({
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

---

> API Reference / Legacy Auth / Retrieve email server configuration

## GET /projects/{project_id}/auth/email_server

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/email_provider` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Response (200)

- `host` (string, optional)
  Hostname of the email server.
- `port` (integer, optional)
  TCP port of the SMTP server. Common values: 25 (SMTP), 465 (SMTPS), 587 (submission).
- `username` (string, optional)
  Username for authenticating with the SMTP server.
- `password` (string, optional)
  On GET, returned redacted (empty) for ordinary callers, while callers with project-credential read permission receive the stored password — do not assume this field is empty. Update (PATCH) responses always return it redacted (empty) regardless of permission. Provide a value on update to set or rotate the password.
- `sender_email` (string, optional)
  Email address used as the From address on outgoing auth emails.
- `sender_name` (string, optional)
  Display name shown as the sender in outgoing emails.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/email_server" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getNeonAuthEmailServer({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Legacy Auth / Update email server configuration

## PATCH /projects/{project_id}/auth/email_server

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth/email_provider` instead. Removal scheduled for March 1, 2026.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID

### Request body

- `host` (string, optional)
  Hostname of the email server.
- `port` (integer, optional)
  TCP port of the SMTP server. Common values: 25 (SMTP), 465 (SMTPS), 587 (submission).
- `username` (string, optional)
  Username for authenticating with the SMTP server.
- `password` (string, optional)
  Password for authenticating with the SMTP server.
- `sender_email` (string, optional)
  Email address used as the From address on outgoing auth emails.
- `sender_name` (string, optional)
  Display name shown as the sender in outgoing emails.

### Response (200)

- `host` (string, optional)
  Hostname of the email server.
- `port` (integer, optional)
  TCP port of the SMTP server. Common values: 25 (SMTP), 465 (SMTPS), 587 (submission).
- `username` (string, optional)
  Username for authenticating with the SMTP server.
- `password` (string, optional)
  On GET, returned redacted (empty) for ordinary callers, while callers with project-credential read permission receive the stored password — do not assume this field is empty. Update (PATCH) responses always return it redacted (empty) regardless of permission. Provide a value on update to set or rotate the password.
- `sender_email` (string, optional)
  Email address used as the From address on outgoing auth emails.
- `sender_name` (string, optional)
  Display name shown as the sender in outgoing emails.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/email_server" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateNeonAuthEmailServer({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID
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

> API Reference / Legacy Auth / Delete integration with auth provider

## DELETE /projects/{project_id}/auth/integration/{auth_provider}

Deprecated. Use `/projects/{project_id}/branches/{branch_id}/auth` instead. Removal scheduled for March 1, 2026.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `auth_provider` (string, path, required)
  The authentication provider name

### Request body

- `delete_data` (boolean, optional)
  If true, deletes the `neon_auth` schema from the database
  Default: `false`

### Response (200)

Delete the integration with the authentication provider

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/auth/integration/$AUTH_PROVIDER" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteNeonAuthIntegration({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    auth_provider: process.env.AUTH_PROVIDER
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
