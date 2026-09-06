---
operationId: "getOrganizationMembers"
method: "GET"
path: "/organizations/{org_id}/members"
tag: "organizations"
interfaces: ["api", "sdk", "console"]
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
