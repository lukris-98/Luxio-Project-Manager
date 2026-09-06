---
operationId: "startAnonymization"
method: "POST"
path: "/projects/{project_id}/branches/{branch_id}/anonymize"
tag: "branches"
interfaces: ["api", "sdk", "console"]
---
> API Reference / Branches / Start anonymization

## POST /projects/{project_id}/branches/{branch_id}/anonymize

Starts the anonymization process for an anonymized branch that is in the initialized, error, or anonymized state.
This will apply all defined masking rules to anonymize sensitive data in the branch databases.
The branch must be an anonymized branch to start anonymization.

**Note**: This endpoint is currently in Beta.


### Parameters

- `project_id` (string, path, required)
  The Neon project ID
- `branch_id` (string, path, required)
  The branch ID

### Response (200)

- `project_id` (string, optional)
  The ID of the project this branch belongs to.
- `branch_id` (string, optional)
  The ID of the anonymized branch.
- `state` (string, optional)
  The current state of the anonymized branch. `created`: branch record exists but setup has not started. `initialized`: setup is complete and the branch is ready for anonymization. `initialization_error`: an error occurred during setup. `anonymizing`: the anonymization process is currently running. `anonymized`: anonymization completed successfully. `error`: an error occurred during anonymization.
  
- `status_message` (string, optional)
  A descriptive message about the current status or any errors
  
- `created_at` (string, optional, format: date-time)
  A timestamp indicating when the anonymized branch was created
  
- `updated_at` (string, optional, format: date-time)
  A timestamp indicating when the anonymized branch status was last updated
  
- `failed_at` (string, optional, format: date-time)
  A timestamp indicating when the anonymized branch operation failed (if applicable)
  
- `last_run` (object, optional)
  Metadata about the most recent anonymization attempt for the branch.
  - `started_at` (string, optional, format: date-time)
    Timestamp indicating when the latest anonymization attempt started.
    
  - `completed_at` (string, optional, format: date-time)
    Timestamp indicating when the latest anonymization attempt completed.
    Populated even if the attempt failed.
    
  - `triggered_by` (string, optional, format: uuid)
    UUID of the user who triggered the latest anonymization attempt.
    
  - `triggered_by_username` (string, optional)
    Username of the user who triggered the latest anonymization attempt.
    
  - `masked_columns` (integer, optional)
    Number of columns that had masking rules applied during the attempt.
    

### Code examples

```bash
curl "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/anonymize" \
  -X POST \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.startAnonymization({
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
