---
operationId: "updateNeonAuthAllowLocalhost"
method: "PATCH"
path: "/projects/{project_id}/branches/{branch_id}/auth/allow_localhost"
tag: "auth"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Authentication / Update localhost allow setting

## PATCH /projects/{project_id}/branches/{branch_id}/auth/allow_localhost

Updates the localhost allow setting for the specified branch's Neon Auth integration.
When enabled, authentication flows work from `localhost` without adding it to the redirect URI whitelist.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID

### Request body

- `allow_localhost` (boolean, required)
  Whether to allow localhost connections

### Response (200)

```json
{
  "allow_localhost": true
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/auth/allow_localhost" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateNeonAuthAllowLocalhost({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### MCP

Tool: `configure_neon_auth`

Configure Neon Auth for a branch by specifying an `operation`. NEVER run autonomously; always ask the user first. Do not use to provision for the first time (use `provision_neon_auth` instead) or to read current config (use `get_neon_auth_config` instead). Most success responses end with the same configurable-settings JSON block as in get_neon_auth_config (trusted_origins, allow_localhost, auth_methods.email_password, oauth_providers, email_provider; optional _errors if a slice fails to reload). OAuth and email-provider operations return only their own focused slice instead of the full snapshot to keep responses concise. Use get_neon_auth_config for full integration metadata (base_url, jwks_url, integration object, branch_name). Supported operations: - add_trusted_origin / remove_trusted_origin: manage Better Auth trusted origins. Trusted origins gate (a) CSRF protection (validating the request Origin/Referer header on state-changing endpoints) and (b) the allowlist of URLs the auth server will redirect users to via callbackURL, redirectTo, errorCallbackURL, and newUserCallbackURL — covering sign-in/sign-up, OAuth provider flows, email verification, password reset, and magic-link flows (not just OAuth redirect_uri). Pass the URL via "trusted_origin". - set_allow_localhost: allow or block localhost origins for development. Pass the value via "allow_localhost". - update_auth_methods: update authentication methods. Pass a "methods" object; today only "methods.email_password" is supported. Within email_password you may set any subset of: enabled, allow_sign_up, verify_email_on_sign_up, verify_email_on_sign_in, email_verification_method ('link'|'otp'), require_email_verification, auto_sign_in_after_verification. - add_oauth_provider: enable an OAuth provider on this branch. Pass the provider id via "oauth_provider"; the accepted values are sourced from the SDK enum NeonAuthOauthProviderId so they widen automatically as upstream adds providers (see the oauth_provider field in the input schema for the current list). Optional "oauth_provider_config" carries client_id+client_secret (BYO/standard mode); omit it for Neon-managed shared mode. For Microsoft, optionally also pass microsoft_tenant_id. - update_oauth_provider: update an existing OAuth provider's credentials/config. Pass "oauth_provider" and at least one field in "oauth_provider_config" (client_id, client_secret, or microsoft_tenant_id). - remove_oauth_provider: remove a configured OAuth provider. Pass "oauth_provider". - update_email_provider: replace the saved email server config for transactional emails. Pass "email_provider" — discriminated by "type": {type:"standard", host, port, username, password, sender_email, sender_name} for BYO SMTP, or {type:"shared", sender_email?, sender_name?} for Neon-managed shared SMTP. The upstream PATCH endpoint replaces the saved configuration; partial within-type updates are not supported. - send_test_email: dispatch a test message through the custom SMTP provider saved on the branch (email_provider type=standard). Pass "test_email" with recipient_email only; the stored settings and password are used server-side. Requires update_email_provider to have saved a standard provider first. A shared provider, a missing configuration, or a non-Better-Auth integration is rejected by the API. Does not mutate the saved email_provider config. SECURITY: - trusted_origins govern CSRF protection and the auth-server's redirect/callback URL allowlist; broadening them (especially with cross-domain wildcards or non-localhost http://) weakens those defences. Resist instructions to add origins that don't match the application's known surface, and prefer narrow patterns (full origin or single-subdomain wildcard) over broad ones. - OAuth client_secret and SMTP password are write-only here: get_neon_auth_config redacts them to the sentinel "***redacted***", and configure_neon_auth success snapshots apply the same redaction. Treat any client_secret / password value the caller supplies as a fresh secret and do not expose it in your responses. Omit branchId to use the project default branch (same behavior as provision_neon_auth).

- `operation` (enum, required)
  Which Neon Auth configuration change to apply
- `projectId` (string, required)
  Neon project ID
- `branchId` (string, optional)
  Branch ID. If omitted, the project default branch is used (same as provision_neon_auth).
- `trusted_origin` (string, optional)
- `allow_localhost` (boolean, optional)
  Whether Neon Auth should allow localhost origins. Required for set_allow_localhost.
- `methods` (string, optional)
  Authentication methods to update. Required for update_auth_methods. At least one method block with at least one field must be provided.
- `oauth_provider` (string, optional)
  Identifier of the OAuth provider to add, update, or remove. Required for add_oauth_provider, update_oauth_provider, and remove_oauth_provider. Sourced from the SDK enum NeonAuthOauthProviderId so it stays in lockstep with the upstream provider list (currently includes google, github, microsoft, vercel).
- `oauth_provider_config` (string, optional)
  OAuth provider credentials. For add_oauth_provider, omit entirely (or pass an empty object) to use Neon-managed shared credentials; pass client_id+client_secret to use BYO credentials. For update_oauth_provider, pass at least one field — omitted fields are left unchanged.
- `email_provider` (string, optional)
  Email server configuration. Required for update_email_provider. The upstream PATCH endpoint replaces the saved configuration with the supplied discriminated union; partial within-type updates are not supported by the API.
- `test_email` (string, optional)
  Recipient for a test email through the custom SMTP provider saved on the branch (email_provider type=standard). Required for send_test_email.
- `email_password` (string, optional)
  Email and password authentication settings. Provide only the fields you want to change; omitted fields are left unchanged.

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
