---
operationId: "createNeonAuth"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/auth"
tag: "auth"
stability: "beta"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Authentication / Enable Neon Auth for the branch

## POST /projects/{project_id}/branches/{branch_id}/auth

Enables Neon Auth for the specified branch by connecting it to an authentication provider.
Creating the integration provisions the `neon_auth` schema in the branch database, which stores user identity data synchronized from the provider.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `auth_provider` (string, required)
  Authentication provider integrated with this Neon Auth configuration. `better_auth` integrates with Better Auth (the current, recommended provider). `stack` integrates with Stack Auth (deprecated). `mock` is a simulated provider for local development and testing only.
  Possible values: `mock`, `stack`, `better_auth`
- `database_name` (string, optional)
  Name of the database to enable Neon Auth on. When omitted, the integration uses the project's default database.

### Response (201)

```json
{
  "auth_provider": "better_auth",
  "auth_provider_project_id": "00000000-0000-0000-0000-000000000000",
  "pub_client_key": "",
  "secret_server_key": "<secret_server_key>",
  "jwks_url": "https://ep-cool-darkness-a5b6c7d8.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json",
  "schema_name": "neon_auth",
  "table_name": "users_sync",
  "base_url": "https://ep-cool-darkness-a5b6c7d8.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createNeonAuth({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon neon-auth enable
```

### MCP

Tool: `provision_neon_auth`

Provisions Neon Auth for a Neon branch. Neon Auth is a managed authentication service built on Better Auth, fully integrated with Lakebase Postgres and the rest of the Neon backend primitives. <workflow> The tool will: 1. Create the `neon_auth` schema in your database to store users, sessions, project configs and organizations 2. Set up secure Auth related APIs for your branch 3. Deploy an auth service in the same region as your Neon compute for low-latency requests 4. Return the Auth URL specific to your branch, along with credentials for your application </workflow> <key_features> - Branch-compatible: Auth data (users, sessions, config) branches with your database - Google and GitHub OAuth included out of the box - Works with RLS: JWTs are validated by the Data API for authenticated queries - Better Auth compatible: Exposes the same APIs and schema as Better Auth </key_features>

- `projectId` (string, required)
  The ID of the project to provision Neon Auth for
- `branchId` (string, optional)
  An optional ID of the branch to provision Neon Auth for. If not provided, the default branch is used.
- `databaseName` (string, optional)
  The database name to provision Neon Auth for. If not provided, the default database is used.

### Console

Console path: Projects → Auth

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
