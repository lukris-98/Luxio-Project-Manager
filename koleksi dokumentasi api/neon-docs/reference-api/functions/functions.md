# Functions

Functions are serverless compute you deploy onto a branch, so your backend code runs next to your database. A function doesn't configure the services it uses: enable a service on the branch and its connection strings and credentials are injected into `process.env` at runtime. A function has 15 minutes to start responding and can keep streaming while data flows, which suits agents and WebSocket or SSE servers. Each branch runs its own functions at their own URLs.

The slug is assigned at first deploy and can't be changed; `name` is a display label only.

Renaming acts only on a function the branch owns. A slug that's only inherited from an ancestor returns `404`, so rename it on the owning branch.

You can also manage functions from the CLI with [`neon functions`](/docs/cli/functions).

Functions are in beta and available only in AWS US East (Ohio) (`aws-us-east-2`). See [Neon Functions](/docs/compute/functions/overview) for the deployment workflow, [Environment variables](/docs/compute/functions/environment-variables) for what gets injected, and [Runtime limits](/docs/compute/functions/reference/runtime-limits) for timeouts and concurrency.

---

> API Reference / Functions / List functions on the branch

## GET /projects/{project_id}/branches/{branch_id}/functions

Lists functions on the specified branch.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `cursor` (string, query, optional)
  A cursor to use in pagination. A cursor defines your place in the data list. Include `response.pagination.next` in subsequent API calls to fetch next page of the list.
- `limit` (integer, query, optional)
  Specify a value from 1 to 1000 to limit number of functions in the response

### Response (200)

```json
{
  "functions": [
    {
      "id": "myfunction",
      "slug": "myfunction",
      "name": "myfunction",
      "invocation_url": "https://br-young-forest-a5b6c7d8-myfunction.compute.c-5.us-east-2.aws.neon.tech/",
      "current_deployment": {
        "id": 4,
        "status": "completed",
        "memory_mib": 2048,
        "runtime": "nodejs24",
        "created_at": "2025-01-15T10:30:00Z"
      },
      "active_deployment": {
        "id": 4,
        "status": "completed",
        "memory_mib": 2048,
        "runtime": "nodejs24",
        "created_at": "2025-01-15T10:30:00Z"
      },
      "created_at": "2025-01-15T11:00:00Z"
    }
  ],
  "pagination": {}
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/functions" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchFunctions({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon functions list
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

> API Reference / Functions / Get function details

## GET /projects/{project_id}/branches/{branch_id}/functions/{slug}

Returns the function identified by its slug.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `slug` (string, path, required)
  The function slug

### Response (200)

```json
{
  "function": {
    "id": "myfunction",
    "slug": "myfunction",
    "name": "myfunction",
    "invocation_url": "https://br-young-forest-a5b6c7d8-myfunction.compute.c-5.us-east-2.aws.neon.tech/",
    "current_deployment": {
      "id": 7,
      "status": "completed",
      "memory_mib": 2048,
      "runtime": "nodejs24",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "active_deployment": {
      "id": 7,
      "status": "completed",
      "memory_mib": 2048,
      "runtime": "nodejs24",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "created_at": "2025-01-15T11:00:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/functions/$SLUG" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchFunction({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    slug: process.env.SLUG
  }
});
```

```bash
# neonctl
neon functions get <branch_id>
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

> API Reference / Functions / Update a function

## PATCH /projects/{project_id}/branches/{branch_id}/functions/{slug}

Updates the function's mutable metadata — currently only the display
`name`. A string sets the display name; `null` clears it, after which
the function's `name` falls back to its slug. Leading and trailing
whitespace is trimmed; a whitespace-only name is rejected. Acts only
on a function owned by the branch: a slug that is only inherited from
an ancestor branch returns 404 — rename it on the branch that owns
it. Like every other change on a branch, a rename is isolated per
branch: a branch forked before the rename keeps the name it had at
fork time.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `slug` (string, path, required)
  The function slug

### Request body

- `name` (string, required)
  New display name for the function. `null` clears the display
  name; the function's `name` then falls back to its slug. Leading
  and trailing whitespace is trimmed; a whitespace-only name is
  rejected.
  

### Response (200)

```json
{
  "function": {
    "id": "myfunction",
    "slug": "myfunction",
    "name": "My Function",
    "invocation_url": "https://br-young-forest-a5b6c7d8-myfunction.compute.c-5.us-east-2.aws.neon.tech/",
    "current_deployment": {
      "id": 10,
      "status": "completed",
      "memory_mib": 2048,
      "runtime": "nodejs24",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "active_deployment": {
      "id": 10,
      "status": "completed",
      "memory_mib": 2048,
      "runtime": "nodejs24",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "created_at": "2025-01-15T11:00:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/functions/$SLUG" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateProjectBranchFunction({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    slug: process.env.SLUG
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

> API Reference / Functions / Delete a function on the branch

## DELETE /projects/{project_id}/branches/{branch_id}/functions/{slug}

Deletes the function identified by its slug.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `slug` (string, path, required)
  The function slug

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/functions/$SLUG" \
  -X DELETE \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.deleteProjectBranchFunction({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    slug: process.env.SLUG
  }
});
```

```bash
# neonctl
neon functions delete <branch_id>
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

> API Reference / Functions / Deploy code to a function

## POST /projects/{project_id}/branches/{branch_id}/functions/{slug}/deployments

Creates a deployment for the function. Supply any subset of zip,
environment, and runtime; omitted fields inherit the
function's latest version. At least one field must be supplied. The
first deployment of a function must include zip. The newest deployment
becomes active.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The Neon branch ID
- `slug` (string, path, required)
  The function slug

### Request body


### Response (201)

```json
{
  "deployment": {
    "id": 1,
    "status": "pending",
    "memory_mib": 2048,
    "runtime": "nodejs24",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/functions/$SLUG/deployments" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.createProjectBranchFunctionDeployment({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID,
    slug: process.env.SLUG
  }
});
```

```bash
# neonctl
neon functions deploy <branch_id>
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
