---
operationId: "getProjectBranchSchemaComparison"
method: "GET"
path: "/projects/{project_id}/branches/{branch_id}/compare_schema"
tag: "branches"
interfaces: ["api", "sdk", "mcp"]
---
> API Reference / Branches / Compare database schema

## GET /projects/{project_id}/branches/{branch_id}/compare_schema

Compares the schema from the specified database with another branch's schema.

### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID
- `base_branch_id` (string, query, optional)
  The branch ID to compare the schema with
- `db_name` (string, query, required)
  Name of the database for which the schema is retrieved
- `lsn` (string, query, optional)
  The Log Sequence Number (LSN) for which the schema is retrieved
  
- `timestamp` (string, query, optional)
  The point in time for which the schema is retrieved
  
- `base_lsn` (string, query, optional)
  The Log Sequence Number (LSN) for the base branch schema
  
- `base_timestamp` (string, query, optional)
  The point in time for the base branch schema
  

### Response (200)

```json
{
  "diff": "--- a/neondb\n+++ b/neondb\n@@ -18,100 +18,404 @@\n SET row_security = off;\n \n --\n--- Name: pg_session_jwt; Type: EXTENSION; Schema: -; Owner: -\n+-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth\n --\n \n-CREATE EXTENSION IF NOT EXISTS pg_session_jwt WITH SCHEMA public;\n+CREATE SCHEMA neon_auth;\n \n \n+ALTER SCHEMA neon_auth OWNER TO neon_auth;\n+\n+SET default_tablespace = '';\n+\n+SET default_table_access_method = heap;\n+\n --\n--- Name: EXTENSION pg_session_jwt; Type: COMMENT; Schema: -; Owner: \n+-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth\n --\n \n-COMMENT ON EXTENSION pg_session_jwt IS 'pg_session_jwt: manage authentication sessions using JWTs';\n+CREATE TABLE neon_auth.account (\n+    id uuid DEFAULT gen_random_uuid() NOT NULL,\n+    \"accountId\" text NOT NULL,\n+    \"providerId\" text NOT NULL,\n+    \"userId\" uuid NOT NULL,\n+    \"accessToken\" text,\n+    \"refreshToken\" text,\n+    \"idToken\" text,\n+    \"accessTokenExpiresAt\" timestamp with time zone,\n+    \"refreshTokenExpiresAt\" timestamp with time zone,\n+    scope text,\n+    password text,\n+    \"createdAt\" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,\n+    \"updatedAt\" timestamp with time zone NOT NULL\n… (truncated for docs)"
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/compare_schema?db_name=$DB_NAME" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getProjectBranchSchemaComparison({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  },
  query: {
    db_name: process.env.DB_NAME,
    timestamp: "2022-11-30T20:09:48Z",
    base_timestamp: "2022-11-30T20:09:48Z"
  }
});
```

### MCP

Tool: `compare_database_schema`

<use_case> Use this tool to compare the schema of a database between two branches. The output of the tool is a JSON object with one field: `diff`. <example> ```json { "diff": "--- a/neondb +++ b/neondb @@ -27,7 +27,10 @@ CREATE TABLE public.users ( id integer NOT NULL, - username character varying(50) NOT NULL + username character varying(50) NOT NULL, + is_deleted boolean DEFAULT false NOT NULL, + created_at timestamp with time zone DEFAULT now() NOT NULL, + updated_at timestamp with time zone ); @@ -79,6 +82,13 @@ -- +-- Name: users_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner +-- + +CREATE INDEX users_created_at_idx ON public.users USING btree (created_at DESC) WHERE (is_deleted = false); + + +-- -- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin -- " } ``` </example> At this field you will find a difference between two schemas. The diff represents the changes required to make the parent branch schema match the child branch schema. The diff field contains a unified diff (git-style patch) as a string. You MUST be able to generate a zero-downtime migration from the diff and apply it to the parent branch. (This branch is a child and has a parent. You can get parent id just querying the branch details.) </use_case> <important_notes> To generate schema diff, you MUST SPECIFY the `database_name`. If `database_name` is not specified, you MUST fall back to the default database name: ``. You MUST TAKE INTO ACCOUNT the PostgreSQL version. The PostgreSQL version is the same for both branches. You MUST ASK user consent before running each generated SQL query. You SHOULD USE `run_sql` tool to run each generated SQL query. You SHOULD suggest creating a backup or point-in-time restore before running the migration. Generated queries change the schema of the parent branch and MIGHT BE dangerous to execute. Generated SQL migrations SHOULD be idempotent where possible (i.e., safe to run multiple times without failure) and include `IF NOT EXISTS` / `IF EXISTS` where applicable. You SHOULD recommend including comments in generated SQL linking back to diff hunks (e.g., `-- from diff @@ -27,7 +27,10 @@`) to make audits easier. Generated SQL should be reviewed for dependencies (e.g., foreign key order) before execution. </important_notes> <next_steps> After executing this tool, you MUST follow these steps: 1. Review the schema diff and suggest generating a zero-downtime migration. 2. Follow these instructions to respond to the client: <response_instructions> <instructions> Provide brief information about the changes: * Tables * Views * Indexes * Ownership * Constraints * Triggers * Policies * Extensions * Schemas * Sequences * Tablespaces * Users * Roles * Privileges </instructions> </response_instructions> 3. If a migration fails, you SHOULD guide the user on how to revert the schema changes, for example by using backups, point-in-time restore, or generating reverse SQL statements (if safe). </next_steps> This tool: 1. Generates a diff between the child branch and its parent. 2. Generates a SQL migration from the diff. 3. Suggest generating zero-downtime migration. <workflow> 1. User asks you to generate a diff between two branches. 2. You suggest generating a SQL migration from the diff. 3. Ensure the generated migration is zero-downtime; otherwise, warn the user. 4. You ensure that your suggested migration is also matching the PostgreSQL version. 5. You use `run_sql` tool to run each generated SQL query and ask the user consent before running it. Before requesting user consent, present a summary of all generated SQL statements along with their potential impact (e.g., table rewrites, lock risks, validation steps) so the user can make an informed decision. 6. Propose to rerun the schema diff tool one more time to ensure that the migration is applied correctly. 7. If the diff is empty, confirm that the parent schema now matches the child schema. 8. If the diff is not empty after migration, warn the user and assist in resolving the remaining differences. </workflow> <hints> <hint> Adding the column with a `DEFAULT` static value will not have any locks. But if the function is called that is not deterministic, it will have locks. <example> ```sql -- No table rewrite, minimal lock time ALTER TABLE users ADD COLUMN status text DEFAULT 'active'; ``` </example> There is an example of a case where the function is not deterministic and will have locks: <example> ```sql -- Table rewrite, potentially longer lock time ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT now(); ``` The fix for this is next: ```sql -- Adding a nullable column first ALTER TABLE users ADD COLUMN created_at timestamptz; -- Setting the default value because the rows are updated UPDATE users SET created_at = now(); ``` </example> </hint> <hint> Adding constraints in two phases (including foreign keys) <example> ```sql -- Step 1: Add constraint without validating existing data -- Fast - only blocks briefly to update catalog ALTER TABLE users ADD CONSTRAINT users_age_positive CHECK (age > 0) NOT VALID; -- Step 2: Validate existing data (can take time but doesn't block writes) -- Uses SHARE UPDATE EXCLUSIVE lock - allows reads/writes ALTER TABLE users VALIDATE CONSTRAINT users_age_positive; ``` </example> <example> ```sql -- Step 1: Add foreign key without validation -- Fast - only updates catalog, doesn't validate existing data ALTER TABLE orders ADD CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID; -- Step 2: Validate existing relationships -- Can take time but allows concurrent operations ALTER TABLE orders VALIDATE CONSTRAINT orders_user_id_fk; ``` </example> </hint> <hint> Setting columns to NOT NULL <example> ```sql -- Step 1: Add a check constraint (fast with NOT VALID) ALTER TABLE users ADD CONSTRAINT users_email_not_null CHECK (email IS NOT NULL) NOT VALID; -- Step 2: Validate the constraint (allows concurrent operations) ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null; -- Step 3: Set NOT NULL (fast since constraint guarantees no nulls) ALTER TABLE users ALTER COLUMN email SET NOT NULL; -- Step 4: Drop the redundant check constraint ALTER TABLE users DROP CONSTRAINT users_email_not_null; ``` </example> <example> For PostgreSQL v18+ (to get PostgreSQL version, you can use `describe_project` tool or `run_sql` tool and execute `SELECT version();` query) ```sql -- PostgreSQL 18+ - Simplified approach ALTER TABLE users ALTER COLUMN email SET NOT NULL NOT VALID; ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null; ``` </example> </hint> <hint> In some cases, you need to combine two approaches to achieve a zero-downtime migration. <example> ```sql -- Step 1: Adding a nullable column first ALTER TABLE users ADD COLUMN created_at timestamptz; -- Step 2: Updating the all rows with the default value UPDATE users SET created_at = now() WHERE created_at IS NULL; -- Step 3: Creating a not null constraint ALTER TABLE users ADD CONSTRAINT users_created_at_not_null CHECK (created_at IS NOT NULL) NOT VALID; -- Step 4: Validating the constraint ALTER TABLE users VALIDATE CONSTRAINT users_created_at_not_null; -- Step 5: Setting the column to NOT NULL ALTER TABLE users ALTER COLUMN created_at SET NOT NULL; -- Step 6: Dropping the redundant NOT NULL constraint ALTER TABLE users DROP CONSTRAINT users_created_at_not_null; -- Step 7: Adding the default value ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now(); ``` </example> For PostgreSQL v18+ <example> ```sql -- Step 1: Adding a nullable column first ALTER TABLE users ADD COLUMN created_at timestamptz; -- Step 2: Updating the all rows with the default value UPDATE users SET created_at = now() WHERE created_at IS NULL; -- Step 3: Creating a not null constraint ALTER TABLE users ALTER COLUMN created_at SET NOT NULL NOT VALID; -- Step 4: Validating the constraint ALTER TABLE users VALIDATE CONSTRAINT users_created_at_not_null; -- Step 5: Adding the default value ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now(); ``` </example> </hint> <hint> Create index CONCURRENTLY <example> ```sql CREATE INDEX CONCURRENTLY idx_users_email ON users (email); ``` </example> </hint> <hint> Drop index CONCURRENTLY <example> ```sql DROP INDEX CONCURRENTLY idx_users_email; ``` </example> </hint> <hint> Create materialized view WITH NO DATA <example> ```sql CREATE MATERIALIZED VIEW mv_users AS SELECT name FROM users WITH NO DATA; ``` </example> </hint> <hint> Refresh materialized view CONCURRENTLY <example> ```sql REFRESH MATERIALIZED VIEW CONCURRENTLY mv_users; ``` </example> </hint> </hints>

- `projectId` (string, required)
  The ID of the project
- `branchId` (string, required)
  The ID of the branch
- `databaseName` (string, required)

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
