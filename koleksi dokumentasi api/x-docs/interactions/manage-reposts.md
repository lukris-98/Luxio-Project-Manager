> This page location: X Developer Platform > x-api/posts/retweets/quickstart/manage-retweets
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/x-api/posts/retweets/quickstart/manage-retweets.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Manage Retweets

> This guide walks you through Retweeting and undoing Retweets using the X API. Reference for the X API v2 standard tier covering quickstart.

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

This guide walks you through Retweeting and undoing Retweets using the X API.

<Note>
  **Prerequisites**

  Before you begin, you'll need:

  * A [developer account](https://developer.x.com/en/portal/petition/essential/basic-info) with an approved App
  * User Access Token (OAuth 1.0a or OAuth 2.0 PKCE)
</Note>

***

## Retweet a Post

<Steps>
  <Step title="Get your user ID">
    You need your authenticated user's ID. You can find it using the [user lookup endpoint](/x-api/users/lookup/introduction) or from your Access Token (the numeric part is your user ID).
  </Step>

  <Step title="Get the Post ID">
    Find the Post ID in the URL when viewing a Post:

    ```
    https://x.com/XDevelopers/status/1228393702244134912
                                    └── This is the Post ID
    ```
  </Step>

  <Step title="Send the Retweet request">
    <CodeGroup dropdown>
      ```bash cURL theme={null}
      curl -X POST "https://api.x.com/2/users/123456789/retweets" \
        -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"tweet_id": "1228393702244134912"}'
      ```

      ```python title="Python SDK" lines wrap icon="python" theme={null}
      from xdk import Client
      from xdk.oauth1_auth import OAuth1

      oauth1 = OAuth1(
          api_key="YOUR_API_KEY",
          api_secret="YOUR_API_SECRET",
          access_token="YOUR_ACCESS_TOKEN",
          access_token_secret="YOUR_ACCESS_TOKEN_SECRET"
      )

      client = Client(auth=oauth1)

      # Retweet a Post
      response = client.posts.retweet(
          user_id="123456789",
          tweet_id="1228393702244134912"
      )

      print(f"Retweeted: {response.data.retweeted}")
      ```

      ```javascript title="JavaScript SDK" lines wrap icon="square-js" theme={null}
      import { Client, OAuth1 } from "@xdevplatform/xdk";

      const oauth1 = new OAuth1({
        apiKey: "YOUR_API_KEY",
        apiSecret: "YOUR_API_SECRET",
        accessToken: "YOUR_ACCESS_TOKEN",
        accessTokenSecret: "YOUR_ACCESS_TOKEN_SECRET",
      });

      const client = new Client({ oauth1 });

      // Retweet a Post
      const response = await client.posts.retweet("123456789", {
        tweetId: "1228393702244134912",
      });

      console.log(`Retweeted: ${response.data?.retweeted}`);
      ```
    </CodeGroup>
  </Step>

  <Step title="Review the response">
    ```json theme={null}
    {
      "data": {
        "retweeted": true
      }
    }
    ```
  </Step>
</Steps>

***

## Undo a Retweet

Remove a Retweet:

<CodeGroup dropdown>
  ```bash cURL theme={null}
  curl -X DELETE "https://api.x.com/2/users/123456789/retweets/1228393702244134912" \
    -H "Authorization: Bearer $USER_ACCESS_TOKEN"
  ```

  ```python title="Python SDK" lines wrap icon="python" theme={null}
  from xdk import Client
  from xdk.oauth1_auth import OAuth1

  oauth1 = OAuth1(
      api_key="YOUR_API_KEY",
      api_secret="YOUR_API_SECRET",
      access_token="YOUR_ACCESS_TOKEN",
      access_token_secret="YOUR_ACCESS_TOKEN_SECRET"
  )

  client = Client(auth=oauth1)

  # Undo a Retweet
  response = client.posts.unretweet(
      user_id="123456789",
      tweet_id="1228393702244134912"
  )

  print(f"Retweeted: {response.data.retweeted}")
  ```

  ```javascript title="JavaScript SDK" lines wrap icon="square-js" theme={null}
  import { Client, OAuth1 } from "@xdevplatform/xdk";

  const oauth1 = new OAuth1({
    apiKey: "YOUR_API_KEY",
    apiSecret: "YOUR_API_SECRET",
    accessToken: "YOUR_ACCESS_TOKEN",
    accessTokenSecret: "YOUR_ACCESS_TOKEN_SECRET",
  });

  const client = new Client({ oauth1 });

  // Undo a Retweet
  const response = await client.posts.unretweet("123456789", "1228393702244134912");

  console.log(`Retweeted: ${response.data?.retweeted}`);
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "data": {
    "retweeted": false
  }
}
```

***

## Next steps

<CardGroup cols={2}>
  <Card title="Retweets lookup" icon="retweet" href="/x-api/posts/retweets/quickstart/retweets-lookup">
    Get users who Retweeted a Post
  </Card>

  <Card title="Quote Posts" icon="quote-left" href="/x-api/posts/quote-tweets/quickstart">
    Get Quote Posts
  </Card>

  <Card title="API Reference" icon="https://mintcdn.com/x-preview/ygI6sSJPehlc0qNT/icons/xds/icon-code.svg?fit=max&auto=format&n=ygI6sSJPehlc0qNT&q=85&s=488e23401b19225b89acc0136d242219" href="/x-api/users/repost-post" width="24" height="24" data-path="icons/xds/icon-code.svg">
    Full endpoint documentation
  </Card>
</CardGroup>
