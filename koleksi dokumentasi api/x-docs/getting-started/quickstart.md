> This page location: X Developer Platform > make-your-first-request
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/make-your-first-request.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Make Your First Request

> Send your first X API v2 request in minutes using cURL or Postman, including authentication, endpoint selection, and parsing the JSON response.

export const Button = ({href, children}) => {
  return <div className="not-prose">
    <a href={href}>
      <button className="x-btn">
        <span>{children}</span>
        <svg width="3" height="24" viewBox="0 -9 3 24" class="h-6 rotate-0 overflow-visible"><path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
      </button>
    </a>
  </div>;
};

This guide walks you through making your first X API request. You'll need a [developer account with app credentials](/x-api/getting-started/getting-access) before starting.

***

## Quick start with cURL

The fastest way to test the API is with cURL. Let's look up a user:

```bash theme={null}
curl "https://api.x.com/2/users/by/username/xdevelopers" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

Replace `$BEARER_TOKEN` with your actual Bearer Token. You'll get a response like:

```json theme={null}
{
  "data": {
    "id": "2244994945",
    "name": "X Developers",
    "username": "xdevelopers"
  }
}
```

***

## Step-by-step guide

<Steps>
  <Step title="Get your Bearer Token">
    In the [Developer Console](https://console.x.com), navigate to your app and copy the Bearer Token.
  </Step>

  <Step title="Choose an endpoint">
    Start with one of these beginner-friendly endpoints:

    | Endpoint                                          | What it does                       |
    | :------------------------------------------------ | :--------------------------------- |
    | [User lookup](/x-api/users/lookup/introduction)   | Get user profile by username or ID |
    | [Post lookup](/x-api/posts/lookup/introduction)   | Get post by ID                     |
    | [Recent search](/x-api/posts/search/introduction) | Search posts from the last 7 days  |
  </Step>

  <Step title="Make the request">
    Use cURL, Postman, or your preferred HTTP client:

    ```bash theme={null}
    # Look up a user by username
    curl "https://api.x.com/2/users/by/username/xdevelopers" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Step>

  <Step title="Parse the response">
    Responses are JSON. The primary data is in the `data` field:

    ```json theme={null}
    {
      "data": {
        "id": "2244994945",
        "name": "X Developers",
        "username": "xdevelopers"
      }
    }
    ```
  </Step>
</Steps>

***

## Request more data with fields

By default, endpoints return minimal fields. Use the `fields` parameter to request additional data:

```bash theme={null}
curl "https://api.x.com/2/users/by/username/xdevelopers?user.fields=created_at,description,public_metrics" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

Response:

```json title="Example response" lines wrap icon="https://mintcdn.com/x-preview/Vn2KEkZaPF9LiPi3/icons/xds/icon-brackets.svg?fit=max&auto=format&n=Vn2KEkZaPF9LiPi3&q=85&s=ed2428e77bab43e57800e1a590e982fa" theme={null}
{
  "data": {
    "id": "2244994945",
    "name": "X Developers",
    "username": "xdevelopers",
    "created_at": "2013-12-14T04:35:55.000Z",
    "description": "The voice of the X Developer Platform",
    "public_metrics": {
      "followers_count": 570842,
      "following_count": 2048,
      "tweet_count": 14052,
      "listed_count": 1672
    }
  }
}
```

[Learn more about fields →](/x-api/fundamentals/fields)

***

## More examples

<Tabs>
  <Tab title="Look up a post">
    ```bash theme={null}
    curl "https://api.x.com/2/tweets/1460323737035677698?tweet.fields=created_at,public_metrics" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Tab>

  <Tab title="Search recent posts">
    ```bash theme={null}
    curl "https://api.x.com/2/tweets/search/recent?query=from:xdevelopers&tweet.fields=created_at" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Tab>

  <Tab title="Get user's posts">
    ```bash theme={null}
    curl "https://api.x.com/2/users/2244994945/tweets?max_results=5" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Tab>
</Tabs>

***

## Using code instead of cURL

<Tabs>
  <Tab title="Python">
    ```python theme={null}
    import requests

    bearer_token = "YOUR_BEARER_TOKEN"
    url = "https://api.x.com/2/users/by/username/xdevelopers"

    headers = {"Authorization": f"Bearer {bearer_token}"}
    response = requests.get(url, headers=headers)

    print(response.json())
    ```
  </Tab>

  <Tab title="JavaScript">
    ```javascript theme={null}
    const bearerToken = "YOUR_BEARER_TOKEN";
    const url = "https://api.x.com/2/users/by/username/xdevelopers";

    fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` }
    })
      .then(res => res.json())
      .then(data => console.log(data));
    ```
  </Tab>

  <Tab title="Official SDKs">
    For production use, we recommend the official SDKs:

    * [Python SDK](/xdks/python/overview)
    * [TypeScript SDK](/xdks/typescript/overview)

    They handle authentication, pagination, and rate limiting automatically.
  </Tab>
</Tabs>

***

## Tools for testing

<CardGroup cols={3}>
  <Card title="Postman" icon="server" href="/tutorials/postman-getting-started">
    Visual API testing with our collection.
  </Card>

  <Card title="Sample code" icon="github" href="https://github.com/xdevplatform/Twitter-API-v2-sample-code">
    Examples in multiple languages.
  </Card>

  <Card title="API reference" icon="https://mintcdn.com/x-preview/ygI6sSJPehlc0qNT/icons/xds/icon-code.svg?fit=max&auto=format&n=ygI6sSJPehlc0qNT&q=85&s=488e23401b19225b89acc0136d242219" href="/x-api/posts/lookup/introduction" width="24" height="24" data-path="icons/xds/icon-code.svg">
    Full endpoint documentation.
  </Card>
</CardGroup>

***

## Troubleshooting

<Accordion title="401 Unauthorized">
  * Check that your Bearer Token is correct
  * Ensure the token hasn't been regenerated
  * Verify the `Authorization` header format: `Bearer YOUR_TOKEN`
</Accordion>

<Accordion title="403 Forbidden">
  * Your app may not have access to this endpoint
  * Some endpoints require user-context authentication (OAuth 1.0a or 2.0)
  * Check your app's permissions in the Developer Console
</Accordion>

<Accordion title="429 Too Many Requests">
  * You've hit a rate limit
  * Check the `x-rate-limit-reset` header for when to retry
  * Implement exponential backoff in your code
</Accordion>

[Full error reference →](/x-api/fundamentals/response-codes-and-errors)

***

## Next steps

<CardGroup cols={2}>
  <Card title="Learn authentication" icon="https://mintcdn.com/x-preview/SxzTbJaLjs3MidH1/icons/xds/icon-key.svg?fit=max&auto=format&n=SxzTbJaLjs3MidH1&q=85&s=de93497af2dde62afd3a06e896d330f5" href="/resources/fundamentals/authentication/overview" width="24" height="24" data-path="icons/xds/icon-key.svg">
    Understand OAuth for user-context requests.
  </Card>

  <Card title="Explore endpoints" icon="compass" href="/x-api/posts/search/introduction">
    Discover what you can build.
  </Card>

  <Card title="Use an SDK" icon="cube" href="/tools-and-libraries">
    Faster development with official libraries.
  </Card>

  <Card title="Build something" icon="hammer" href="/x-api/what-to-build">
    Ideas for what to create.
  </Card>
</CardGroup>
