---
operationId: "listProjectBranchDatabases"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/databases"
tag: "branches"
interfaces: ["api", "sdk", "cli", "mcp", "console"]
---
> API Reference / Branches / List databases

## GET /projects/{project_id}/branches/{branch_id}/databases

Retrieves a list of databases for the specified branch.
A branch can have multiple databases.
For related information, see [Manage databases](https://neon.com/docs/manage/databases/).


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

```json
{
  "databases": [
    {
      "id": 1000000,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "dbname",
      "owner_name": "alex",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": 1000001,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "neondb",
      "owner_name": "neondb_owner",
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z"
    },
    {
      "id": 1000002,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-database-2",
      "owner_name": "alex",
      "created_at": "2025-01-15T11:30:00Z",
      "updated_at": "2025-01-15T11:30:00Z"
    },
    {
      "id": 1000003,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-database",
      "owner_name": "alex",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": 1000004,
      "branch_id": "br-young-forest-a5b6c7d8",
      "name": "my-database-3",
      "owner_name": "alex",
      "created_at": "2025-01-15T12:30:00Z",
      "updated_at": "2025-01-15T12:30:00Z"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/databases" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.listProjectBranchDatabases({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

```bash
# neonctl
neon connection-string [branch] list
```

### MCP

Tool: `inspect_database`

<use_case> Reach for this first when asked why a database is slow, large, bloated, or behind. It runs one predefined, read-only Postgres diagnostic against a Neon branch — pick the one that answers the question from the `check` parameter's list, instead of writing catalog SQL by hand. These are the same checks as the `neon inspect db` CLI command. </use_case> <important_notes> Not for: arbitrary SQL (`run_sql`), the slowest queries by average execution time with your own threshold and limit (`list_slow_queries`), the plan of one statement (`explain_sql_statement`), applying an optimization (`prepare_query_tuning`), compute and Neon Function logs (`query_logs`), or listing tables and columns (`get_database_tables`, `describe_table_schema`). Several checks read alike and are not: `long-running-queries` is what is running right now in the inspected database and has been for over five minutes; `stalled-queries` is a compute-wide snapshot of active queries running longer than 30 seconds with parallel-worker grouping, waits, and blockers; `outliers` is cumulative execution time since statistics were last reset; and `calls` is call frequency over that same history. Omit `databaseName` to run a database-scoped check against every database on the branch. The result adds a `database` column. `stalled-queries`, `lfc-hit-rate`, `working-set`, and `replication-slots` are compute-wide: they run once against the first listed database. For `lfc-hit-rate` and `working-set`, cache counters reset when the compute restarts. One failing database fails the whole run. `bloat` is a statistical estimate, not a measurement. When a check needs an extension that is not installed, the tool says so and names the `CREATE EXTENSION` statement. Installing it writes to the user's database — ask before running it. </important_notes>

- `check` (enum, required)
  Which diagnostic to run:
- `projectId` (string, required)
  The ID of the project to inspect
- `branchId` (string, optional)
  An optional ID of the branch. If not provided the default branch is used.
- `databaseName` (string, optional)
- `computeId` (string, optional)
  The ID of the compute/endpoint. If not provided, the read-write compute associated with the branch will be used.
- `limit` (number, optional)
  Maximum number of rows to return from the combined result. Per-database ranking and SQL caps are applied first. The response reports how many rows the check produced and whether they were truncated, so raise this only when `truncated` is true. A few checks are capped in SQL and say so in their description.

### Console

Console path: Projects → Branches → Roles & Databases

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
