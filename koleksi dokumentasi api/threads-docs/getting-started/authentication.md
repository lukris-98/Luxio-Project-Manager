> This page location: Threads API > threads/get-started/get-access-tokens-and-permissions
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/get-started/get-access-tokens-and-permissions

# Get Access Tokens



This guide explains how to use the Authorization Window to get permissions from Threads users for short-lived Threads user access tokens.

## Step 1: Get Authorization

The Authorization Window allows app users to grant your app permissions and short-lived Threads user access tokens. After a user logs in and chooses which data to allow your app to access, we will redirect the user to your app and include an authorization code, which you can then exchange for a short-lived access token.

To begin the process, get the Authorization Window and present it to the user:

```
https://threads.net/oauth/authorize
  ?client_id=&lt;THREADS_APP_ID&gt;
  &amp;redirect_uri=&lt;REDIRECT_URI&gt;
  &amp;scope=&lt;SCOPE&gt;
  &amp;response_type=code
  &amp;state=&lt;STATE&gt; // Optional
```

If accessing the Authorization Window from an Android mobile system, make sure to open the URL in the native webview or browser and not the native app.

An example of how you can achieve this with JavaScript:

```javascript
window.open(url, &#039;_system&#039;);`
```

### Parameters

**Note:** All parameters except `state` are required.

| Name | Description |
| --- | --- |
| `client_id`&lt;br&gt;&lt;br&gt;numeric string | **Required.**  &lt;br&gt;Your Threads App ID displayed in **App Dashboard** &gt; **App settings** &gt; **Basic** &gt; **Threads App ID**.  &lt;br&gt;**Example:** `990602627938098` |
| `redirect_uri`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;A URI where we will redirect users after they allow or deny permission requests. Make sure this exactly matches one of the base URIs in your list of [valid OAuth URIs](https://developers.facebook.com/documentation/development/create-an-app/threads-use-case#step-7--add-settings). Keep in mind that the App Dashboard may have added a trailing slash to your URIs, so we recommend that you verify by checking the list.  &lt;br&gt;**Example:** https://socialsizzle.herokuapp.com/auth/ |
| `response_type`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Set this value to `code`. |
| `scope`&lt;br&gt;&lt;br&gt;comma-separated or space-separated list | **Required.**  &lt;br&gt;A comma-separated list, or URL-encoded space-separated list, of permissions to request from the app user.  &lt;br&gt;**Note:** `threads_basic` is required.  &lt;br&gt;**Values:** `threads_basic`, `threads_content_publish`, `threads_read_replies`, `threads_manage_replies`, `threads_manage_insights` |
| `state`&lt;br&gt;&lt;br&gt;string | An optional value indicating a server-specific state. For example, you can use this to protect against CSRF issues. We will include this parameter and value when redirecting the user back to you.  &lt;br&gt;**Example:** `1` |

### Sample Authorization Window URL

```
https://threads.net/oauth/authorize
  ?client_id=990602627938098
  &amp;redirect_uri=https://socialsizzle.herokuapp.com/auth/
  &amp;scope=threads_basic,threads_content_publish
  &amp;response_type=code
```

### Successful Authorization

If authorization is successful, we will redirect the user to your redirect_uri and pass you an authorization code through the code query string parameter. Capture the code so your app can exchange if for a short-lived Threads User Access Token.

Authorization codes are valid for 1 hour and can only be used once.

#### Sample Successful Authentication Redirect

```
https://socialsizzle.herokuapp.com/auth/?code=AQBx-hBsH3...#_
```

**Note:** `#_` will be appended to the end of the redirect URI, but it is not part of the code itself, so strip it out.

### Canceled Authorization

If the user cancels the authorization flow, we will redirect the user to your `redirect_uri` and append the following error parameters.

**Note:** It is your responsibility to fail gracefully in these situations and display an appropriate message to your users.

| Error Parameter | Description |
| --- | --- |
| `error` | `acceess_denied` |
| `error_reason` | `user_denied` |
| `error_description` | `The+user+denied+your+request` |

#### Sample Canceled Authorization Redirect

```
https://socialsizzle.herokuapp.com/auth/?error=access_denied
  &amp;error_reason=user_denied
  &amp;error_description=The+user+denied+your+request
```

## Step 2: Exchange the Code For a Token

Once you receive a code, exchange it for a short-lived access token by sending a `POST` request to the following endpoint:

```
POST https://graph.threads.net/oauth/access_token
```

### Parameters

Include the following parameters in your `POST` request body.

| Name | Description |
| --- | --- |
| `client_id`&lt;br&gt;&lt;br&gt;numeric string | **Required.**  &lt;br&gt;Your Threads App ID displayed in **App Dashboard** &gt; **App settings** &gt; **Basic** &gt; **Threads App ID**.  &lt;br&gt;**Example:** `990602627938098` |
| `client_secret`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Your Threads App Secret displayed in **App Dashboard** &gt; **App settings** &gt; **Basic** &gt; **Threads App secret**.  &lt;br&gt;**Example:** `a1b2C3D4` |
| `code`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The authorization code we passed you in the `code` parameter when redirecting the user to your `redirect_uri`.  &lt;br&gt;**Example:** `AQBx-hBsH3...` |
| `grant_type`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Set this value to `authorization_code`. |
| `redirect_uri`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The redirect URI you passed us when you directed the user to our Authorization Window. This must be the same URI or we will reject the request.  &lt;br&gt;**Example:** https://socialsizzle.heroku.com/auth/ |

### Sample Request

```
curl -X POST \
  https://graph.threads.net/oauth/access_token \
  -F client_id=990602627938098 \
  -F client_secret=eb8c7... \
  -F grant_type=authorization_code \
  -F redirect_uri=https://socialsizzle.herokuapp.com/auth/ \
  -F code=AQBx-hBsH3...
```

### Sample Success Response

If successful, the API will return a JSON payload containing the app user&#039;s short-lived access token and User ID.

```
&#123;
  &quot;access_token&quot;: &quot;THQVJ...&quot;,
  &quot;user_id&quot;: 17841405793187218
&#125;
```

Capture the `access_token` value. This is the user’s short-lived Threads user access token, which your app can use to access Threads API endpoints.

### Sample Rejected Response

If the request is malformed in some way, the API will return an error.

```
&#123;
  &quot;error_type&quot;: &quot;OAuthException&quot;,
  &quot;code&quot;: 400,
  &quot;error_message&quot;: &quot;Matching code was not found or was already used&quot;
&#125;
```
