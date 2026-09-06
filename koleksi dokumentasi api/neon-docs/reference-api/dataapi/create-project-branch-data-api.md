---
operationId: "createProjectBranchDataAPI"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/data-api/{database_name}"
tag: "dataapi"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Data API / Create Neon Data API

## POST /projects/{project_id}/branches/{branch_id}/data-api/{database_name}

Creates a new instance of Neon Data API in the specified branch.
The Data API exposes a REST interface over the branch database. The `database_name` path parameter determines which database the API serves.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `database_name` (string, path, required)
  The database name

### Request body

- `auth_provider` (string, optional)
  Authentication provider for the Neon Data API. `neon_auth`: use Neon's built-in managed authentication (no JWKS configuration required). `external`: use an external JWT provider, which requires `jwks_url`. When omitted, no auth provider is configured (existing setup is kept).
  Possible values: `neon_auth`, `external`
- `jwks_url` (string, optional, format: uri)
  URL of the JWKS endpoint used to verify JWTs for this Data API. Required when configuring JWT-based authentication; omit when using a non-JWT auth provider.
- `provider_name` (string, optional)
  Display name for the authentication provider. Accepted values include "Clerk", "Stytch", and "Auth0", but any non-empty string is valid. Optional field.
- `jwt_audience` (string, optional)
  Expected `aud` claim in incoming JWTs. When set, tokens with a different audience are rejected; tokens with no audience are still accepted. Omit to skip audience validation.
  
- `add_default_grants` (boolean, optional)
  Grant all permissions to the tables in the public schema to authenticated users
  Default: `false`
- `skip_auth_schema` (boolean, optional)
  Skip creating the auth schema and RLS functions
  Default: `false`
- `settings` (object, optional)
  Auth and schema configuration for the Data API.
  - `db_aggregates_enabled` (boolean, optional)
    Enable aggregates feature
    Default: `true`
  - `db_anon_role` (string, optional)
    Database role to use for anonymous requests
    Default: `anonymous`
  - `db_extra_search_path` (string, optional)
    Extra schemas to add to the search path
  - `db_max_rows` (integer, optional)
    Hard limit on the number of rows returned in a single Data API response. No limit when unset.
  - `db_schemas` (array, optional)
    List of schemas to expose via the API. Default: ["public"]
  - `jwt_role_claim_key` (string, optional)
    JWT claim key to use for role extraction
    Default: `.role`
  - `jwt_cache_max_lifetime` (integer, optional)
    Maximum lifetime of the Data API's JWT cache, in seconds.
  - `openapi_mode` (string, optional)
    OpenAPI specification mode (ignore-privileges, disabled)
    Default: `disabled`
  - `server_cors_allowed_origins` (string, optional)
    CORS allowed origins
  - `server_timing_enabled` (boolean, optional)
    When enabled, the Data API adds `Server-Timing` headers to each response showing database execution and internal processing time. Default: disabled.

### Response (201)

```json
{
  "url": "https://ep-cool-darkness-a5b6c7d8.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/data-api/$DATABASE_NAME" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchDataApi({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    database_name: process.env.DATABASE_NAME
  }
});
```

```bash
# neonctl
neon data-api create
```

### MCP

Tool: `provision_neon_data_api`

Provisions the Neon Data API for a Neon branch. The Data API enables HTTP-based access to your Postgres database with automatic JWT authentication support. <interactive_behavior> When called WITHOUT an authProvider: 1. Automatically checks if Neon Auth is already provisioned 2. Checks if Data API already exists 3. Returns authentication options for user selection: - neon_auth: Use Neon Auth (recommended) - external: Use external provider (Clerk, Auth0, Stytch) - none: No authentication (not recommended) 4. User selects an option, then call this tool again with authProvider specified When called WITH authProvider="neon_auth" and provisionNeonAuthFirst=true: - Automatically provisions Neon Auth first (if not already set up) - Then provisions the Data API with Neon Auth integration When called WITH authProvider="none": - Provisions Data API without a pre-configured JWKS - User will need to manually configure a JWKS URL before the Data API can be used </interactive_behavior> <workflow> The tool will: 1. Resolve the default branch if branchId is not provided 2. Resolve the default database if databaseName is not provided 3. If no authProvider: check existing config and return options for selection 4. If authProvider specified: create the Data API endpoint with that auth 5. If provisionNeonAuthFirst: set up Neon Auth before Data API 6. Return the Data API URL for your application </workflow> <key_features> - HTTP-based API: Access your Postgres database via REST endpoints - JWT Authentication: Supports Neon Auth or external providers (Clerk, Auth0, Stytch, etc.) - Row Level Security: Works with RLS policies for fine-grained access control - Branch-compatible: Data API configuration branches with your database - PostgREST-compatible: Uses the same API patterns as PostgREST </key_features>

- `projectId` (string, required)
  The ID of the project to provision the Data API for
- `branchId` (string, optional)
  An optional ID of the branch to provision the Data API for. If not provided, the default branch is used.
- `databaseName` (string, optional)
  The database name to provision the Data API for. If not provided, the default database is used.
- `authProvider` (enum, optional)
  The authentication provider - "neon_auth" for Neon Auth integration, "external" for third-party providers like Clerk, Auth0, or Stytch, or "none" for unauthenticated access (not recommended). If not specified, the tool will check existing auth configuration and return options for selection.
- `jwksUrl` (string, optional)
  The JWKS URL for external authentication providers. Required when authProvider is "external".
- `providerName` (string, optional)
  The name of the external authentication provider (e.g., "Clerk", "Auth0", "Stytch"). Used when authProvider is "external".
- `jwtAudience` (string, optional)
  The expected JWT audience claim. Tokens without an audience claim will still be accepted.
- `provisionNeonAuthFirst` (boolean, optional)
  When true with authProvider="neon_auth", provisions Neon Auth before Data API if not already set up.

### Console

Console path: Projects → Data API

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
