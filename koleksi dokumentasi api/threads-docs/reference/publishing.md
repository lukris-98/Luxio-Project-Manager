> This page location: Threads API > threads/reference/publishing
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/publishing

# Publishing



The Threads publishing endpoints allow you to upload and publish Threads media objects and check their status. See [Post to Threads](https://developers.facebook.com/documentation/threads/posts) for more information.

## `POST /&#123;threads-user-id&#125;/threads`
Upload media and create media containers. See [Posts](https://developers.facebook.com/documentation/threads/posts) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `media_type`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;**Values:** `TEXT`, `IMAGE`, `VIDEO`, `CAROUSEL` |
| `text`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;The text associated with the post. Uses [UTF-8 encoding](https://www.npmjs.com/package/grapheme-splitter). For text-only posts, this parameter is **required**.&lt;br&gt;&lt;br&gt;**Note:** For the post character limit, emojis are counted as the number of UTF-8 bytes. |
| `image_url`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Required if `media_type=IMAGE`. |
| `video_url`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Required if `media_type=VIDEO`. |
| `is_carousel_item`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;**Values:** `true`, `false` (default) |
| `children`&lt;br&gt;&lt;br&gt;array | **Optional.**  &lt;br&gt;Required if `media_type=CAROUSEL`. |
| `reply_to_id`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Required if replying to a post. |
| `reply_control`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Can be used to specify who can reply to a post.  &lt;br&gt;**Values:** `everyone`, `accounts_you_follow`, `mentioned_only`, `parent_post_author_only`, `followers_only` |
| `allowlisted_country_codes`&lt;br&gt;&lt;br&gt;list&lt;string&gt; | **Optional.**  &lt;br&gt;A string list of valid [ISO 3166-1 alpha-2 country codes](https://www.iso.org/obp/ui/#search) that represents the countries where this media should be shown. If this parameter is passed in, the media will not be shown to Threads profiles in countries outside of this list. |
| `alt_text`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;The accessibility text label or description for an image or video in a Threads post.  &lt;br&gt;**Note:** The maximum length of `alt_text` is 1,000 characters. |
| `link_attachment`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;The URL attached to a Threads post. |
| `quote_post_id`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;ID of the post that is intended to be quoted. |
| `poll_attachment`&lt;br&gt;&lt;br&gt;object | **Optional.**  &lt;br&gt;The options for a post with a poll attachment. |
| `auto_publish_text`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;When this optional flag is passed, a Threads post is published automatically when a Threads [media container](https://developers.facebook.com/documentation/threads/posts#step-1--create-a-threads-media-container) is created without needing to go through the extra [publish step](https://developers.facebook.com/documentation/threads/posts#step-2--publish-a-threads-media-container).  &lt;br&gt;**Note:** This only works for text posts. |
| `topic_tag`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;The topic to add to a post.  &lt;br&gt;**Note:** The following characters are not allowed in topic tags:&lt;br&gt;&lt;br&gt;* Periods (.)&lt;br&gt;* Ampersands (&amp;) |
| `is_spoiler_media`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;Indicates if the media should be a spoiler or not.&lt;br&gt;&lt;br&gt;**Values:** `true`, `false` |
| `text_entities`&lt;br&gt;&lt;br&gt;object | **Optional.**  &lt;br&gt;The spoiler settings for the post. |
| `text_attachment`&lt;br&gt;&lt;br&gt;object | **Optional.**  &lt;br&gt;The text attachment for the post. |
| `gif_attachment`&lt;br&gt;&lt;br&gt;object | **Optional.**  &lt;br&gt;The ID and GIF provider for the GIF to attach to the post.&lt;br&gt;&lt;br&gt;**Fields:** `gif_id`, `provider` |
| `is_ghost_post`&lt;br&gt;&lt;br&gt;Boolean | **Optional**  &lt;br&gt;Indicates if the post is a ghost post or not.&lt;br&gt;&lt;br&gt;**Values:** `true`, `false` |
| `enable_reply_approvals`&lt;br&gt;&lt;br&gt;Boolean | **Optional**  &lt;br&gt;Indicates if the post should have reply approvals enabled.&lt;br&gt;&lt;br&gt;**Values:** `true`, `false` |
| `crossreshare_to_ig`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;Cross-shares a Threads post to a linked Instagram account as a Story when set to `true`.  &lt;br&gt;**Values:** `true`, `false` (*default*) |
| `crossreshare_to_ig_dark_mode`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;Cross-shares a Threads post to a linked Instagram account as a Story in dark mode when set to `true`.  &lt;br&gt;**Values:** `true`, `false` (*default*) |
| `location_id`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;The ID of the location being tagged.  &lt;br&gt;**Note:** Use the [`GET /location_search`](https://developers.facebook.com/documentation/threads/reference/location-search) endpoint to find location IDs. |

## `POST /&#123;threads-user-id&#125;/threads_publish`
Publish uploaded media using their media containers. See [Posts](https://developers.facebook.com/documentation/threads/posts) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `creation_id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Identifier of the Threads media container. |

## `GET /&#123;threads-container-id&#125;?fields=status`
Check the Threads media container publishing eligibility and status.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-container-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media container identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `status` *(default)*, `error_message` |

## `POST /&#123;threads-media-id&#125;/repost`

Repost a Threads post that was previously published. See [Reposts](https://developers.facebook.com/documentation/threads/posts/reposts) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |

## `DELETE /&#123;threads-media-id&#125;`

Delete a Threads post. See [Delete Posts](https://developers.facebook.com/documentation/threads/posts/delete-posts) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |

