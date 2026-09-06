---
operationId: "removeProjectMemberRole"
method: "DELETE"
path: "/projects/{project_id}/members/{member_id}/role"
tag: "projects"
interfaces: ["api", "sdk"]
---
> API Reference / Projects / Remove an org member's role on a project

## DELETE /projects/{project_id}/members/{member_id}/role

Idempotently removes the explicit project grant. The member's organization-role
default project permission still applies. Self-DELETE requires
`confirm_self_lockout=true` when effective manage access would be lost.


### Parameters

- `project_id` (string, path, required)
- `member_id` (string, path, required)
- `confirm_self_lockout` (boolean, query, optional)

### Response (200)

- `project_id` (string, optional)
- `member_id` (string, optional, format: uuid)
- `user_id` (string, optional, format: uuid)
- `email` (string, optional, format: email)
  Email address of the user who has been granted access to the project.
- `name` (string, optional)
  The user's display name.
- `org_role` (string, optional)
  Organization-level role used by project member role management.
  
  Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
- `project_role` (string, optional)
  The resulting effective project role after applying org-admin default access, explicit grants, and creator fallback. Null only when the member has no remaining effective project access.
  Possible values: `viewer`, `editor`, `admin`
- `org_default_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `explicit_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `effective_project_permission` (string, optional)
  The caller's effective permission for a project when
  per-project permissions are enabled. `VIEWER` grants read access,
  `EDITOR` adds update access, and `ADMIN` grants full management.
  Omitted for personal projects, flag-off organizations, and non-user
  subjects.
  
  Possible values: `VIEWER`, `EDITOR`, `ADMIN`
- `credential_rotation_recommended` (boolean, optional)
  Hint that database credentials may need rotation after the role change.
  
- `org_api_key_rotation_recommended` (boolean, optional)
  Hint that project-scoped org API keys created by the target user may need rotation.
  

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/members/$MEMBER_ID/role" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.removeProjectMemberRole({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
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
