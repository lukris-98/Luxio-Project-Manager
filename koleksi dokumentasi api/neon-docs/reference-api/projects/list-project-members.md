---
operationId: "listProjectMembers"
method: "GET"
path: "/projects/{project_id}/members"
tag: "projects"
interfaces: ["api", "sdk"]
---
> API Reference / Projects / List org members and their project roles

## GET /projects/{project_id}/members

Lists organization members and their per-project roles for an org-owned project.
Returns 404 when the project is not org-owned, per-project role management is disabled,
or the caller has no access. Callers with VIEWER or EDITOR see members with
effective project access. Callers with ADMIN also see unassigned org members.


### Parameters

- `project_id` (string, path, required)
- `cursor` (string, query, optional)
  A cursor to use in pagination. A cursor defines your place in the data list. Include `response.pagination.next` in subsequent API calls to fetch next page of the list.
- `limit` (integer, query, optional)
  The maximum number of members to return in the response

### Response (200)

- `project_members` (array, optional)
  - `member_id` (string, required, format: uuid)
    The organization member ID.
  - `user_id` (string, required, format: uuid)
    The user ID for the organization member.
  - `email` (string, optional, format: email)
    Email address of the user who has been granted access to the project.
  - `name` (string, optional)
    The user's display name.
  - `org_role` (string, required)
    Organization-level role used by project member role management.
    
    Possible values: `admin`, `member`, `editor`, `viewer`, `collaborator`
  - `project_role` (string, optional)
    Per-project role. `viewer` maps to `VIEWER`, `editor` maps to `EDITOR`,
    and `admin` maps to `ADMIN`.
    
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
  - `grant_source` (string, optional)
    How a member's project access is granted.
    
    Possible values: `explicit`, `org_role_default`, `org_admin_override`, `unassigned`
- `pagination` (object, optional)
  To paginate the response, issue an initial request with `limit` value. Then, add the value returned in the response `.pagination.next` attribute into the request under the `cursor` query parameter to the subsequent request to retrieve next page in pagination. The contents on cursor `next` are opaque, clients are not expected to make any assumptions on the format of the data inside the cursor.
  - `next` (string, optional)
    Cursor for the next page of results. Pass it as the `cursor` query parameter on the next request. Absent on the last page.
  - `sort_by` (string, optional)
    Field by which the results were sorted, echoing the request's sort_by parameter.
  - `sort_order` (string, optional)
    Sort order active for this page. Pass back as `sort_order` in the next request to maintain consistent ordering. Valid values are `asc` and `desc`.

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/members" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectMembers({
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
