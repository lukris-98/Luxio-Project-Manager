> This page location: Threads API > threads/get-started
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/get-started

# Get Started



**Warning:** To access the Threads API, create an app and pick the [Threads Use Case](https://developers.facebook.com/documentation/development/create-an-app/threads-use-case).

This guide provides information on what you need to get started using the Threads API.

## Before You Start

You need the following:

### Meta App

A [Meta app](https://developers.facebook.com/apps) created with the [Threads use case](https://developers.facebook.com/documentation/development/create-an-app/threads-use-case).

**Note:** When creating your app there will be 2 app IDs and app secrets. For Threads API implementation purposes, use the Threads app ID and its corresponding app secret.

### Public Server
We download media used in publishing attempts so the media must be hosted on a publicly accessible server at the time of the attempt.

### Authorization

Data access authorization is controlled by your app users through the use of the permissions listed below. Users must grant your app these permissions through the [Authorization Window](#authorization-window) before your app can access their data. For more details, refer to our [Permissions guide](https://developers.facebook.com/docs/permissions#t).

* `threads_basic` — Required for all Threads endpoints.
* `threads_content_publish` — Required for Threads publishing endpoints only.
* `threads_manage_replies` — Required for making `POST` calls to reply endpoints.
* `threads_read_replies` — Required for making `GET` calls to reply endpoints.
* `threads_manage_insights` — Required for making `GET` calls to insights endpoints.

[Threads testers](#threads-testers) can grant your app these permissions at any time. In order for app users without a role on your app to be able to grant your app these permissions, each permission must first be approved through the [App Review](https://developers.facebook.com/documentation/resp-plat-initiatives/individual-processes/app-review) process, and your app must be published.

Permission grants made by app users with public profiles are valid for 90 days. [Refreshing](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens#refresh-a-long-lived-token) an app user&#039;s long-lived access token will extend the permission grant for another 90 days if the app user who granted the token has a public profile. If the app user&#039;s profile is [private](https://help.instagram.com/225222310104065), however, the permission grant cannot be extended and the app user must grant the expired permission to your app again.

### Threads User Access Tokens

API authentication is handled by Threads user access tokens that conform to the OAuth 2.0 protocol. Access tokens are app-scoped (unique to the app and user pair) and can be short-lived or long-lived. API requests that query Threads users or publish Threads media must include a Threads user access token. Use the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to debug your Threads User Access Token.

#### Short-Lived Access Tokens

Short-lived access tokens are valid for 1 hour, but can be exchanged for [long-lived tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens). To get a short-lived access token, implement the [Authorization Window](#authorization-window) into your app. After the app user authenticates their identity through the window, we will redirect the user back to your app and include an [authorization code](#authorization-codes), which you can then [exchange for a short-lived access token](https://developers.facebook.com/documentation/threads/get-started/get-access-tokens-and-permissions).

#### Long-Lived Access Tokens

Short-lived tokens that have not expired can be [exchanged for long-lived access tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens), which are valid for 60 days. Long-lived tokens can be [refreshed](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens#refresh-a-long-lived-token) before they expire by querying the `GET /refresh_access_token` endpoint.

### Authorization Window

The Authorization Window allows your app to get [authorization codes](#authorization-codes) and [permissions](https://developers.facebook.com/docs/permissions#t) from app users. Authorization codes can be exchanged for [Threads user access tokens](#threads-user-access-tokens), which must be included when fetching an app user&#039;s profile, retrieving Threads media, publishing posts, reading replies, managing replies, or viewing insights.

To implement the Authorization Window, refer to the [Getting Access Tokens](https://developers.facebook.com/documentation/threads/get-started/get-access-tokens-and-permissions) guide.

### Authorization Codes

Authorization codes can be exchanged for short-lived [Threads user access tokens](#threads-user-access-tokens). To get an authorization code, implement the [Authorization Window](#authorization-window) into your app. After an app user authenticates their identity through the window and grants your app any permissions it needs, we will redirect the user to your app and include an authorization code. You can then use the API to exchange the code for the app user&#039;s short-lived Threads user access token.

**Note:** Authorization codes are short-lived and are only valid for 1 hour.

### Threads Testers

In order to test your app with a Threads user, you must first send an invitation to the Threads user&#039;s profile and accept the invitation. Invitations can be sent by clicking on the **Add People** button and selecting **Threads Tester** in the **App Dashboard** &gt; **App roles** &gt; **Roles** tab.

Invitations can be accepted by the Threads user in the **Website permissions** section under [**Account Settings**](https://www.threads.net/settings/account) of the Threads website or mobile app after signing into their account.

## Sample App

Our open-source [Threads API sample app](https://github.com/fbsamples/threads_api) serves as a practical guide, enabling you to better understand the API and troubleshoot any issues by referencing a working implementation. This can simplify the integration process, accelerate development time, and ensure a smoother implementation experience.

## Next Steps

* Make [Single Thread Posts](https://developers.facebook.com/documentation/threads/posts#single-thread-posts)
* Make [Carousel Posts](https://developers.facebook.com/documentation/threads/posts#carousel-posts)
* [Retrieve Threads Media](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts)
