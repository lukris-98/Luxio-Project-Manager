> This page location: Threads API > threads/retrieve-and-discover-posts/retrieve-posts
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts

# Retrieve User Posts



This document shows you how to retrieve:

* [A list of all threads created by an app-scoped user](#retrieve-a-list-of-an-app-scoped-user-s-threads)
* [A list of all threads created by a public profile](#retrieve-a-list-of-a-public-profile-s-threads)
* [A single Threads media object](#retrieve-a-single-threads-media-object)
* [A list of all ghost posts created by an app-scoped user](#retrieve-a-list-of-an-app-scoped-user-s-ghost-posts)

**Note:** To retrieve posts that are replies, refer to [Retrieve User Replies](https://developers.facebook.com/documentation/threads/retrieve-and-manage-replies/retrieve-replies).

## Retrieve a List of an App-Scoped User&#039;s Threads &#123;#retrieve-a-list-of-an-app-scoped-user-s-threads&#125;

Use the `GET /&#123;threads-user-id&#125;/threads` endpoint to return a paginated list of all threads created by a user.

### Permissions

The Threads Retrieval API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.

### Limitations

* You may only fetch a paginated list of all threads created by the app-scoped user.

### Fields
Here&#039;s a list of fields that can be returned for each Thread.

| Name | Description |
| --- | --- |
| `id` (default) | The media&#039;s ID. |
| `media_product_type` | Surface where the media is published. In the case of Threads, the value is `THREADS`. |
| `media_type` | The media type for a Threads post will be one of these values: `TEXT_POST`, `IMAGE`, `VIDEO`, `CAROUSEL_ALBUM`, `AUDIO`, or `REPOST_FACADE`.&lt;br&gt;&lt;br&gt;**Note:** `media_type` will return `TEXT_POST` for posts containing GIFs and polls. |
| `media_url` | The post’s media URL. |
| `permalink` | Permanent link to the post. Will be omitted if the media contains copyrighted material or has been flagged for a copyright violation. |
| `owner` | Threads user ID who created the post.  &lt;br&gt;&lt;br&gt;**Note:** This is only available on top-level posts that you own. |
| `username` | Threads username who created the post. |
| `text` | Represents text for a Threads post. |
| `timestamp` | Post time. The publish date in ISO 8601 format. |
| `shortcode` | Shortcode of the media. |
| `thumbnail_url` | URL of thumbnail. This only shows up for Threads media with video. |
| `children` | List of child posts. This only shows up for carousel posts. |
| `is_quote_post` | Indicates if the media is a quoted post made by another user. |
| `quoted_post` | Media ID of the post that was quoted.  &lt;br&gt;&lt;br&gt;**Note**: This only appears on quote posts. |
| `reposted_post` | Media ID of the post that was reposted.  &lt;br&gt;&lt;br&gt;**Note**: This only appears on reposts. |
| `alt_text` | The accessibility text label or description for an image or video in a Threads post. |
| `link_attachment_url` | The URL attached to a Threads post. |
| `gif_url` | The URL of the GIF attached to the post (if any).  &lt;br&gt;&lt;br&gt;**Note:** This will only show up on posts that have a GIF attachment. |
| `poll_attachment` | The poll attachment for the post.  &lt;br&gt;&lt;br&gt;**Note:** This will only show up on posts that have a poll. |
| `topic_tag` | The topic tag in the post&#039;s header (if any).  &lt;br&gt;&lt;br&gt;**Note:** This will only show up on posts that have a topic tag. |
| `is_spoiler_media` | Indicates if media objects were posted as spoilers. |
| `text_entities` | Indicates if spoilers are present in the text field of the posts. |
| `text_attachment` | The text attachment for the post. |
| `ghost_post_status` | The status of a ghost post.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `ACTIVE` — An active ghost post.&lt;br&gt;* `ARCHIVED` — An expired ghost post.&lt;br&gt;&lt;br&gt;**Note:** This will only show for posts that are ghost posts. |
| `ghost_post_expiration_timestamp` | Timestamp of when the post will or has expired in ISO 8601 format.&lt;br&gt;&lt;br&gt;**Note:** This will only show for posts that are ghost posts. |
| `is_verified` | Returns `true` if the post author&#039;s profile is verified on Threads. |
| `profile_picture_url` | Returns the URL of the post author&#039;s profile picture on Threads. |

### Example Request

```html
curl -s -X GET \
&quot;https://graph.threads.net/v1.0/me/threads?fields=id,media_product_type,media_type,media_url,permalink,owner,username,text,topic_tag,timestamp,shortcode,thumbnail_url,children,is_quote_post&amp;since=2023-10-15&amp;until=2023-11-18&amp;limit=1&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

### Example Response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;1234567&quot;,
      &quot;media_product_type&quot;: &quot;THREADS&quot;,
      &quot;media_type&quot;: &quot;TEXT_POST&quot;,
      &quot;permalink&quot;: &quot;https://www.threads.net/&#064;threadsapitestuser/post/abcdefg&quot;,
      &quot;owner&quot;: &#123;
        &quot;id&quot;: &quot;1234567&quot;
      &#125;,
      &quot;username&quot;: &quot;threadsapitestuser&quot;,
      &quot;text&quot;: &quot;Today Is Monday&quot;,
      &quot;topic_tag&quot;: &quot;Mondays&quot;,
      &quot;timestamp&quot;: &quot;2023-10-17T05:42:03+0000&quot;,
      &quot;shortcode&quot;: &quot;abcdefg&quot;,
      &quot;is_quote_post&quot;: false
    &#125;,
  ],
  &quot;paging&quot;: &#123;
    &quot;cursors&quot;: &#123;
      &quot;before&quot;: &quot;BEFORE_CURSOR&quot;,
      &quot;after&quot;: &quot;AFTER_CURSOR&quot;
    &#125;
  &#125;
&#125;
```

## Retrieve a List of a Public Profile&#039;s Threads &#123;#retrieve-a-list-of-a-public-profile-s-threads&#125;

Use the `GET /profile_posts?username=...` endpoint to look up a public profile and retrieve a paginated list of their posts on Threads.

### Permissions

The Threads Profile Discovery API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.
* `threads_profile_discovery` — Required for making any calls to all Threads Profile Discovery API endpoints.

With [standard access](https://developers.facebook.com/docs/graph-api/overview/access-levels), only posts from some of the official Meta accounts can be retrieved. These include &#064;meta, &#064;threads, &#064;instagram, and &#064;facebook.

### Limitations

* Only returns public profiles with at least 100 followers.
* A user can send a maximum of 1,000 requests within a rolling 24-hour period. Once a query is sent, it will count against this limit for 24 hours.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `username`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Unique username on Threads. Must be an exact match. |

### Fields

The same fields as those for an [app-scoped user&#039;s posts](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#fields) can be retrieved except for the `owner` field.

### Example Request

```html
curl -i -X GET \
  &quot;https://graph.threads.net/v1.0/profile_posts?access_token=&lt;THREADS_TESTER_ACCESS_TOKEN&gt;&amp;username=&lt;THREADS_USERNAME&gt;&amp;fields=id,media_product_type,media_type,media_url,permalink,username,text,topic_tag,timestamp,shortcode,thumbnail_url,children,is_quote_post&amp;since=2023-10-15&amp;until=2023-11-18&amp;limit=1&quot;
```

### Example Response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;1234567&quot;,
      &quot;media_product_type&quot;: &quot;THREADS&quot;,
      &quot;media_type&quot;: &quot;TEXT_POST&quot;,
      &quot;permalink&quot;: &quot;https://www.threads.net/&#064;meta/post/abcdefg&quot;,
      &quot;username&quot;: &quot;meta&quot;,
      &quot;text&quot;: &quot;Today Is Monday&quot;,
      &quot;topic_tag&quot;: &quot;Mondays&quot;,
      &quot;timestamp&quot;: &quot;2023-10-17T05:42:03+0000&quot;,
      &quot;shortcode&quot;: &quot;abcdefg&quot;,
      &quot;is_quote_post&quot;: true
    &#125;,
  ],
  &quot;paging&quot;: &#123;
    &quot;cursors&quot;: &#123;
      &quot;before&quot;: &quot;BEFORE_CURSOR&quot;,
      &quot;after&quot;: &quot;AFTER_CURSOR&quot;
    &#125;
  &#125;
&#125;
```

## Retrieve a Single Threads Media Object

You can also use the `GET /&#123;threads-media-id&#125;` endpoint to return an single Threads media object.

### Permissions

The Threads Retrieval API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.

If your app has not been approved for [advanced access](https://developers.facebook.com/docs/graph-api/overview/access-levels) for the `threads_basic` permission, only posts created by a Threads tester are retrievable. After approval, public posts created by other users will be retrievable.

### Fields

The same fields as those for an [app-scoped user&#039;s posts](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#fields) can be retrieved.

### Example Request

```html
curl -s -X GET \
&quot;https://graph.threads.net/v1.0/&lt;THREADS_MEDIA_ID&gt;?fields=id,media_product_type,media_type,media_url,permalink,owner,username,text,topic_tag,timestamp,shortcode,thumbnail_url,children,is_quote_post&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

### Example Response

```json
&#123;
  &quot;id&quot;: &quot;1234567&quot;,
  &quot;media_product_type&quot;: &quot;THREADS&quot;,
  &quot;media_type&quot;: &quot;TEXT_POST&quot;,
  &quot;permalink&quot;: &quot;https://www.threads.net/&#064;threadsapitestuser/post/abcdefg&quot;,
  &quot;owner&quot;: &#123;
    &quot;id&quot;: &quot;1234567&quot;
  &#125;,
  &quot;username&quot;: &quot;meta&quot;,
  &quot;text&quot;: &quot;Today Is Monday&quot;,
  &quot;topic_tag&quot;: &quot;Mondays&quot;,
  &quot;timestamp&quot;: &quot;2023-10-09T23:18:27+0000&quot;,
  &quot;shortcode&quot;: &quot;abcdefg&quot;,
  &quot;is_quote_post&quot;: false
&#125;
```

## Retrieve a List of an App-Scoped User&#039;s Ghost Posts &#123;#retrieve-a-list-of-an-app-scoped-user-s-ghost-posts&#125;

Use the `GET /&#123;threads-user-id&#125;/ghost_posts` endpoint to return a paginated list of all ghost post threads created by an app-scoped user.

To create a ghost post, see [Create Ghost Posts](https://developers.facebook.com/documentation/threads/create-posts/ghost-posts) for more information.

### Permissions

The Threads Ghost Posts API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the [Graph API Explorer](https://developers.facebook.com/tools/explorer/).

* `threads_basic` — Required for making any calls to all Threads API endpoints.

If your app has not been approved for advanced access for the `threads_basic` permission, only posts created by a Threads tester are retrievable. After approval, public posts created by other users will be retrievable.

### Fields

The same fields as those for an [app-scoped user&#039;s posts](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#fields) can be retrieved.

### Example request

```html
curl -GET \
  -d &quot;fields=id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,ghost_post_status,ghost_post_expiration_timestamp&quot; \
  -d &quot;since=&lt;START_DATE&gt;&quot; \
  -d &quot;until=&lt;END_DATE&gt;&quot; \
  -d &quot;limit=1&quot; \
  -d &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot;
&quot;https://graph.threads.net/v1.0/me/ghost_posts&quot;
```

### Example response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;&lt;MEDIA_ID&gt;&quot;,
      &quot;media_product_type&quot;: &quot;THREADS&quot;,
      &quot;media_type&quot;: &quot;TEXT_POST&quot;,
      &quot;permalink&quot;: &quot;https://www.threads.com/&lt;THREADS_USERNAME&gt;/post/&lt;POST_ID&gt;&quot;,
      &quot;owner&quot;: &#123;
        &quot;id&quot;: &quot;&lt;THREADS_USER_ID&gt;&quot;
      &#125;,
      &quot;username&quot;: &quot;&lt;THREADS_USERNAME&gt;&quot;,
      &quot;text&quot;: &quot;&lt;TEXT&gt;&quot;,
      &quot;timestamp&quot;: &quot;&lt;TIMESTAMP&gt;&quot;,
      &quot;shortcode&quot;: &quot;&lt;MEDIA_SHORTCODE&gt;&quot;,
      &quot;ghost_post_status&quot;: &quot;ARCHIVED&quot;,
      &quot;ghost_post_expiration_timestamp&quot;: &quot;&lt;EXPIRATION_TIMESTAMP&gt;&quot;
    &#125;
  ],
  &quot;paging&quot;: &#123;
    &quot;cursors&quot;: &#123;
      &quot;before&quot;: &quot;BEFORE_CURSOR&quot;,
      &quot;after&quot;: &quot;AFTER_CURSOR&quot;
    &#125;
  &#125;
&#125;
```
