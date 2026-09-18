> This page location: Threads API > threads/threads-profiles
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/threads-profiles

# Threads Profiles



The [Threads Profile API](https://developers.facebook.com/documentation/threads/reference/user#get---threads-user-id--fields-id-username----) and [Threads Profile Discovery API](https://developers.facebook.com/documentation/threads/reference/user#get--profile-lookup-username----) provide 2 ways of retrieving Threads profile information depending on scope.

## Retrieve a Threads App-Scoped User&#039;s Profile Information

Use the `GET /&#123;threads-user-id&#125;?fields=id,username,...` endpoint to return profile information about a Threads user.

### Permissions

The Threads Profile API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.

### Limitations

* You may only fetch the profile of the app-scoped user.

### Fields

| Name | Description |
| --- | --- |
| `id` | Threads user ID. This is returned by default. |
| `username` | Handle or unique username on Threads. |
| `name` | Display name of the user on Threads. |
| `threads_profile_picture_url` | URL of the user&#039;s profile picture on Threads. |
| `threads_biography` | Biography text on Threads profile. |
| `is_verified` | Returns `true` if the user is verified on Threads. |

### Example Request

```html
curl -s -X GET \
&quot;https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography,is_verified&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

### Example Response

```json
&#123;
  &quot;id&quot;: &quot;1234567&quot;,
  &quot;username&quot;: &quot;threadsapitestuser&quot;,
  &quot;name&quot;: &quot;Threads API Test User&quot;,
  &quot;threads_profile_picture_url&quot;: &quot;https://scontent-sjc3-1.cdninstagram.com/link/to/profile/picture/on/threads/&quot;,
  &quot;threads_biography&quot;: &quot;This is my Threads bio.&quot;,
  &quot;is_verified&quot;: false
&#125;
```

## Retrieve a Threads User&#039;s Public Profile Information

Use the `GET /profile_lookup?username=...` endpoint to look up a public profile and retrieve their basic profile information.

### Permissions

The Threads Profile Discovery API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.
* `threads_profile_discovery` — Required for making any calls to all Threads Profile Discovery API endpoints.

With [standard access](https://developers.facebook.com/docs/graph-api/overview/access-levels), only some of the official Meta accounts can be looked up. These include &#064;meta, &#064;threads, &#064;instagram, and &#064;facebook.

### Limitations

* Only returns public profiles with at least 100 followers.
* A user can send a maximum of 1,000 requests within a rolling 24-hour period. Once a query is sent, it will count against this limit for 24 hours.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `username`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Handle or unique username on Threads. Must be an exact match. |

### Fields

| Name | Description |
| --- | --- |
| `username`&lt;br&gt;&lt;br&gt;string | Handle or unique username on Threads. |
| `name`&lt;br&gt;&lt;br&gt;string | Display name of the user on Threads. |
| `profile_picture_url`&lt;br&gt;&lt;br&gt;string | URL of the user&#039;s profile picture on Threads. |
| `biography`&lt;br&gt;&lt;br&gt;string | Biography text on Threads profile. |
| `follower_count`&lt;br&gt;&lt;br&gt;int | Total follower count of the user. |
| `likes_count`&lt;br&gt;&lt;br&gt;int | Likes count of the user&#039;s posts in the past 7 days. |
| `quotes_count`&lt;br&gt;&lt;br&gt;int | Quotes count of the user&#039;s posts in the past 7 days. |
| `reposts_count`&lt;br&gt;&lt;br&gt;int | Reposts count of the user&#039;s posts in the past 7 days. |
| `views_count`&lt;br&gt;&lt;br&gt;int | Views count of the user&#039;s posts in the past 7 days. |
| `is_verified`&lt;br&gt;&lt;br&gt;Boolean | Returns `true` if the user is verified on Threads. |

### Example Request

```html
curl -i -X GET \
  &quot;https://graph.threads.net/v1.0/profile_lookup?access_token=&lt;ACCESS_TOKEN&gt;&amp;username=&lt;THREADS_USERNAME&gt;&quot;
```

### Example Response

```json
&#123;
  &quot;username&quot;: &quot;meta&quot;,
  &quot;name&quot;: &quot;Meta&quot;,
  &quot;profile_picture_url&quot;: &quot;https://scontent-sjc3-1.cdninstagram.com/link/to/profile/picture/on/threads/&quot;,
  &quot;biography&quot;: &quot;Connect with what you love to make things happen. It’s Your World.&quot;,
  &quot;is_verified&quot;: true,
  &quot;follower_count&quot;: 1234567,
  &quot;likes_count&quot;: 1234567,
  &quot;quotes_count&quot;: 1234567,
  &quot;replies_count&quot;: 1234567,
  &quot;reposts_count&quot;: 1234567,
  &quot;views_count&quot;: 1234567
&#125;
```
