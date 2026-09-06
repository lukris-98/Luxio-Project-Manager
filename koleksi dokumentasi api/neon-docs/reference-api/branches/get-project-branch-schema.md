---
operationId: "getProjectBranchSchema"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/schema"
tag: "branches"
interfaces: ["api", "sdk", "cli", "console"]
---
> API Reference / Branches / Retrieve database schema

## GET /projects/{project_id}/branches/{branch_id}/schema

Retrieves the database schema. Specify `lsn` or `timestamp` (not both) to read at a point in time; omit both to read from the database's head.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `db_name` (string, query, required)
  Name of the database for which the schema is retrieved
- `lsn` (string, query, optional)
  The Log Sequence Number (LSN) for which the schema is retrieved
  
- `timestamp` (string, query, optional)
  The point in time for which the schema is retrieved
  
- `format` (string, query, optional)
  The format of the schema to retrieve. Possible values:
  - `sql` (default)
  - `json`
  

### Response (200)

```json
{
  "sql": "--\n-- PostgreSQL database dump\n--\n\n-- Dumped from database version 17.10 (4f20678)\n-- Dumped by pg_dump version 17.10 (4f20678)\n\nSET statement_timeout = 0;\nSET lock_timeout = 0;\nSET idle_in_transaction_session_timeout = 0;\nSET transaction_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\nSELECT pg_catalog.set_config('search_path', '', false);\nSET check_function_bodies = false;\nSET xmloption = content;\nSET client_min_messages = warning;\nSET row_security = off;\n\n--\n-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin\n--\n\nALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;\n\n\n--\n-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin\n--\n\nALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;\n\n\n--\n-- PostgreSQL database dump complete\n--\n\n"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/schema?db_name=$DB_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchSchema({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  query: {
    db_name: process.env.DB_NAME,
    timestamp: "2022-11-30T20:09:48Z"
  }
});
```

```bash
# neonctl
neon branches schema-diff [base] [compare]
```

### Console

Console path: Projects → Branches

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
