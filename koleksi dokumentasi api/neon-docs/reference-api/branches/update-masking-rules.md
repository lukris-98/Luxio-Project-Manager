---
operationId: "updateMaskingRules"
method: "PATCH"
path: "/projects/{project_id}/branches/{branch_id}/masking_rules"
tag: "branches"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Branches / Update masking rules

## PATCH /projects/{project_id}/branches/{branch_id}/masking_rules

Updates the masking rules for the specified anonymized branch.
Masking rules define how sensitive data should be anonymized using PostgreSQL Anonymizer.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Request body

- `masking_rules` (array, required)
  List of masking rules to apply to the branch.
  This will replace all existing masking rules for the branch.
  
  - `database_name` (string, required)
    The name of the database containing the table to be masked
    
  - `schema_name` (string, required)
    The name of the schema containing the table to be masked
    
  - `table_name` (string, required)
    The name of the table containing the column to be masked
    
  - `column_name` (string, required)
    The name of the column to be masked
    
  - `masking_function` (string, optional)
    The PostgreSQL Anonymizer masking function to apply.
    Can be a predefined function (e.g., 'anon.random_string(10)', 'anon.fake_email()')
    or a custom function definition (e.g., 'anon.hash(column_name)')
    
  - `masking_value` (string, optional)
    A literal value to set on the column when masking.
    

### Response (200)

```json
{
  "masking_rules": []
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/masking_rules" \
  -X PATCH \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.updateMaskingRules({
  client: neon.client,
  path: {
    project_id: process.env.PROJECT_ID,
    branch_id: process.env.BRANCH_ID
  }
});
```

### Console

Console path: Projects → Branches → Data Masking

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
