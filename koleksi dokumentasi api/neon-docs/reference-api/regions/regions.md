# Regions

This is a read-only reference endpoint. It returns the available regions where Neon projects can be created, with each region's ID and display name.

Use the `region_id` from this response when creating a project. Region is set at creation and cannot be changed.

See [Regions](/docs/introduction/regions) for availability and latency considerations.

---

> API Reference / Regions / List supported regions

## GET /regions

Lists supported Neon regions.

**Note:** Not all regions are available to all organizations. Pass the `org_id`
parameter to get an accurate list of regions available to your organization.


### Parameters

- `org_id` (string, query, optional)
  Organization ID. When provided, returns only regions available to this organization.
  Recommended for accurate region availability.
  

### Response (200)

```json
{
  "regions": [
    {
      "region_id": "aws-us-east-2",
      "name": "AWS US East 2 (Ohio)",
      "default": false,
      "geo_lat": "39.96",
      "geo_long": "-83"
    },
    {
      "region_id": "aws-us-east-1",
      "name": "AWS US East 1 (N. Virginia)",
      "default": true,
      "geo_lat": "38.13",
      "geo_long": "-78.45"
    },
    {
      "region_id": "aws-us-west-2",
      "name": "AWS US West 2 (Oregon)",
      "default": false,
      "geo_lat": "46.15",
      "geo_long": "-123.88"
    },
    {
      "region_id": "aws-eu-central-1",
      "name": "AWS Europe Central 1 (Frankfurt)",
      "default": false,
      "geo_lat": "50",
      "geo_long": "8"
    },
    {
      "region_id": "aws-eu-west-2",
      "name": "AWS Europe West 2 (London)",
      "default": false,
      "geo_lat": "51.5",
      "geo_long": "0.12"
    },
    {
      "region_id": "aws-ap-southeast-1",
      "name": "AWS Asia Pacific 1 (Singapore)",
      "default": false,
      "geo_lat": "1.37",
      "geo_long": "103.8"
    },
    {
      "region_id": "aws-ap-southeast-2",
      "name": "AWS Asia Pacific 2 (Sydney)",
      "default": false,
      "geo_lat": "-33.85",
      "geo_long": "151.2"
    },
    {
      "region_id": "aws-sa-east-1",
      "name": "AWS South America East 1 (São Paulo)",
      "default": false,
      "geo_lat": "-23.49",
      "geo_long": "-46.81"
    }
  ]
}
```

### Code examples

```bash
curl "https://console.neon.tech/api/v2/regions" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

```typescript
import { createNeonClient, raw } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY });
const { data } = await raw.getActiveRegions({
  client: neon.client
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
