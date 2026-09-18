> This page location: X Developer Platform > x-api/posts/retweets/introduction
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/x-api/posts/retweets/introduction.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Retweets

> The Retweets endpoints let you retweet and undo retweets, see who retweeted a Post, and get. Reference for the X API v2 standard tier covering retweets.

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

The Retweets endpoints let you retweet and undo retweets, see who retweeted a Post, and get reposts of your own Posts.

## Overview

<CardGroup cols={2}>
  <Card title="Retweet" icon="retweet">
    Retweet a Post on behalf of a user
  </Card>

  <Card title="Undo retweet" icon="xmark">
    Remove a retweet
  </Card>

  <Card title="Retweeting users" icon="https://mintcdn.com/x-preview/SxzTbJaLjs3MidH1/icons/xds/icon-people.svg?fit=max&auto=format&n=SxzTbJaLjs3MidH1&q=85&s=9d5f3f82edcd2a4070364193436e7980" width="24" height="24" data-path="icons/xds/icon-people.svg">
    See who retweeted a Post
  </Card>

  <Card title="Reposts of me" icon="repeat">
    Get reposts of your own Posts
  </Card>
</CardGroup>

***

## Endpoints

### Retweets lookup

| Method | Endpoint                                                      | Description                               |
| :----- | :------------------------------------------------------------ | :---------------------------------------- |
| GET    | [`/2/tweets/:id/retweeted_by`](/x-api/posts/get-reposted-by)  | Get users who retweeted a Post            |
| GET    | [`/2/tweets/:id/quote_tweets`](/x-api/posts/get-quoted-posts) | Get quote Posts of a Post                 |
| GET    | [`/2/users/reposts_of_me`](/x-api/users/get-reposts-of-me)    | Get reposts of authenticated user's Posts |

### Manage retweets

| Method | Endpoint                                                        | Description    |
| :----- | :-------------------------------------------------------------- | :------------- |
| POST   | [`/2/users/:id/retweets`](/x-api/users/repost-post)             | Retweet a Post |
| DELETE | [`/2/users/:id/retweets/:tweet_id`](/x-api/users/unrepost-post) | Undo a retweet |

***

## Example: Get retweeting users

```bash theme={null}
curl "https://api.x.com/2/tweets/1234567890/retweeted_by?\
user.fields=username,verified" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

## Example: Retweet a Post

```bash theme={null}
curl -X POST "https://api.x.com/2/users/123456789/retweets" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tweet_id": "1234567890"}'
```

***

## Getting started

<Note>
  **Prerequisites**

  * An approved [developer account](https://developer.x.com/en/portal/petition/essential/basic-info)
  * A [Project and App](/resources/fundamentals/developer-apps) in the Developer Console
  * Your App's [keys and tokens](/resources/fundamentals/authentication)
</Note>

<CardGroup cols={2}>
  <Card title="Lookup quickstart" icon="retweet" href="/x-api/posts/retweets/quickstart/retweets-lookup">
    Get retweets for a Post
  </Card>

  <Card title="Manage quickstart" icon="plus" href="/x-api/posts/retweets/quickstart/manage-retweets">
    Retweet and undo retweets
  </Card>

  <Card title="Reposts of me" icon="repeat" href="/x-api/posts/retweets/quickstart/retweets-of-me">
    Get reposts of your Posts
  </Card>

  <Card title="API Reference" icon="https://mintcdn.com/x-preview/ygI6sSJPehlc0qNT/icons/xds/icon-code.svg?fit=max&auto=format&n=ygI6sSJPehlc0qNT&q=85&s=488e23401b19225b89acc0136d242219" href="/x-api/posts/get-reposted-by" width="24" height="24" data-path="icons/xds/icon-code.svg">
    Full endpoint documentation
  </Card>
</CardGroup>
