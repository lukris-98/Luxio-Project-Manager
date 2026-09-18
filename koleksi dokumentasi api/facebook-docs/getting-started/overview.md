> This page location: Facebook Pages API > pages-api/overview
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/overview

# Overview



The Pages API is a set of Facebook Graph API endpoints that apps can use to create and manage a Page&#039;s settings and content.

## Components

### Access Tokens

API authentication is handled through Access Tokens. Most endpoints require Page access tokens, which are unique to each Page, app User, and app, and have an expiration time. In order to get a token from an app User, the app User must own or be able to perform a Task on the Page.

You can get access tokens from your app Users by implementing Facebook Login for Business.

### Graph API

If you are unfamiliar with the Graph API, please read our Graph API documentation before proceeding to learn more about the Meta social graph.

### Facebook Login

Facebook Login allows app users to log into your app and for your app to ask your users for permissions to access data.

### Facebook Login for Business

Facebook Login for Business is the preferred authentication and authorization solution for Tech Providers and business app developers who need access to their business clients&#039; assets

### Features

Some endpoints require a Feature which must be approved through the App Review process before your app can use them when your app goes live. Features allow you to access public Page data without a permission or the ability to perform a task on the Page. Refer to each endpoint&#039;s reference to determine which Page Feature it requires.

### Mentions

&#064;mentions allows your Page to publicly reply to a specific person, who has posted on your Page or commented on your Page post, in a comment or reply.

### Page-Scoped User IDs &#123;#psids&#125;

Users who interact with Pages are identified by Page-Scoped User IDs (PSID). PSIDs are IDs that are unique to each User-Page pair. Pages API and Messenger Platform endpoints rely on PSIDs, so you can use a PSID to identify a User&#039;s interactions with a Page, as well as the User&#039;s public Messenger conversations with that Page.

### Permissions

Most endpoints require one or more permissions which must be granted to your app by app users. Typically this can be done through Facebook Login but can also be done through the Business Manager, if your app has been claimed by a Business.

All permissions require App Review before an app user can grant them to your app after it is live. For Business apps, which do not have app modes, permissions must be approved for Advanced access before they can be granted to your app by an app user without a role on the app itself or a role in a Business that has claimed it.

### Page Search

Find information about Facebook Pages including names, locations, and find Pages to &#064;Mention, Page locations, and tag a Page to show branded content.

### Rate Limits

All Pages endpoint requests are subject to Rate Limiting. You can see your app&#039;s current call count consumption in the **App Dashboard**.

### Tasks

Tasks allow Users to perform specific actions on a Page. When a User uses an app to interact with a Page, depending on the attempted action, we will first check if the User has been approved for a task that permits that type of action.

You can approve individual users for the following tasks:

| Task | Permitted Actions |
| --- | --- |
| `ADVERTISE` | * Create ads&lt;br&gt;* Create unpublished Page Posts&lt;br&gt;* If an Instagram account is connected to the Page, create ads |
| `ANALYZE` | * View Insights of the Page&lt;br&gt;* View which Page admin published a post or comment |
| `CREATE_CONTENT` | * Publish content as the Page on the Page |
| `MANAGE` | * Assign and manage Page tasks |
| `MANAGE_LEADS` | * View and manage leads |
| `MESSAGING` | * Send messages as the Page |
| `MODERATE` | * Respond to comments on Page posts as the Page&lt;br&gt;* Delete comments on Page posts&lt;br&gt;* If an Instagram account is connected to the Page, publish content to Instagram from Facebook, respond to and delete comments, send Direct messages, sync business contact info, and create ads. |
| `VIEW_MONETIZATION_INSIGHTS` | * View monetization insights |

If a person is given Admin access to a Page in the UI, that person is able to perform all tasks on that Page.

### Messenger Platform

Have Messenger conversations with your customers or people interested in your Page.

### Meta Webhooks for Pages

Get get real-time notifications when a user comments on a Page post or reacts to your Page post.

## App Review

All Page-related Permissions and Features require approval through the App Review process before your app can use them when your app goes live.

Apps in Development Mode can request any Permission from any app User who has a Role on the app.

## How It Works

This is a typical flow for accessing the Pages API:

1. Get a User Access Token from your app user through Facebook Login for Business.
1. Query the `/me/accounts` endpoint to get the ID and Page Access Token of the Page the app User has permitted your app to access.
1. Capture the returned Page ID and Page Access Token.
1. Use the ID and token to query the Page node.

Note that in some cases the app User may grant your app access to more than one Page, in which case you should capture each Page ID and its respective token, and provide a way for the app User to target each of those Pages.

## Next Steps

Follow our [Get Started guide](https://developers.facebook.com/documentation/pages-api/getting-started) to learn how to publish a Page post using the Pages API.

## See Also

#### App Development with Meta

- [App Roles](https://developers.facebook.com/documentation/development/build-and-test/app-roles)

- [Developing with Meta](https://developers.facebook.com/documentation/development)

- [Graph API](https://developers.facebook.com/docs/graph-api)

- [`/me` Endpoint](https://developers.facebook.com/docs/graph-api/overview#me)

- [Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#pages)

#### Authentication and Authorization

- [Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens)

- [Advanced Access for Business apps](https://developers.facebook.com/docs/graph-api/overview/access-levels)

- [Facebook Login](https://developers.facebook.com/documentation/facebook-login)

- [Facebook Login for Business](https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business)

- [Page-scoped User IDs](https://developers.facebook.com/docs/pages/access-tokens/psid-api)

#### Page Guides

- [Mentions](https://developers.facebook.com/documentation/pages-api/comments-mentions)

- [Messenger Platform Documentation](https://developers.facebook.com/documentation/business-messaging/messenger-platform)

- [Pages Search](https://developers.facebook.com/documentation/pages-api/search-pages)

#### References

- [Features Reference](https://developers.facebook.com/docs/features-reference)

- [Page Endpoint Reference](https://developers.facebook.com/docs/graph-api/reference/page)

- [Permissions Reference](https://developers.facebook.com/docs/permissions#p)

- [Permission Dependencies Reference](https://developers.facebook.com/docs/permissions#permission-dependencies)

- [User Accounts Endpoint Reference](https://developers.facebook.com/docs/graph-api/reference/user/accounts)

