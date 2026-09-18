> This page location: Threads API > threads/reference/reply-management
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/reply-management

# Reply Management



The Threads reply management endpoints allow you to retrieve replies and conversations and hide/unhide replies. See [Threads Reply Management API](https://developers.facebook.com/documentation/threads/reply-management) for more information.

## `GET /&#123;threads-media-id&#125;/replies`

Retrieve a paginated list of all top-level replies for a Threads media object. See [Replies](https://developers.facebook.com/documentation/threads/reply-management#replies) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`, `has_replies`, `root_post`, `replied_to`, `is_reply`, `is_reply_owned_by_me`, `hide_status`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `topic_tag`, `is_verified`, `profile_picture_url` |
| `reverse`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;Whether or not replies should be sorted in reverse chronological order.  &lt;br&gt;**Values:** `true` *(default)*, `false` |
| `before` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `GET /&#123;threads-media-id&#125;/conversation`
Retrieve a paginated and flattened list of all top-level and nested replies for a Threads media object. See [Conversations](https://developers.facebook.com/documentation/threads/reply-management#conversations) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`, `has_replies`, `root_post`, `replied_to`, `is_reply`, `is_reply_owned_by_me`, `hide_status`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `topic_tag`, `is_verified`, `profile_picture_url` |
| `reverse`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;Whether or not replies should be sorted in reverse chronological order.  &lt;br&gt;**Values:** `true` *(default)*, `false` |
| `before` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `POST /&#123;threads-reply-id&#125;/manage_reply`
Hide or unhide a top-level reply on your Threads post. See [Hide Replies](https://developers.facebook.com/documentation/threads/reply-management#hide-replies) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-reply-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads reply media identifier. |
| `hide`&lt;br&gt;&lt;br&gt;Boolean | **Required.**  &lt;br&gt;Set to `true` to hide a reply and set to `false` to unhide a reply.  &lt;br&gt;**Values:** `true`, `false` |

## `GET /&#123;threads-media-id&#125;/pending_replies`

Fetch a paginated list of all pending replies. See [Reply Approvals](https://developers.facebook.com/documentation/threads/reply-management#reply-approvals) for more information.

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`, `has_replies`, `root_post`, `replied_to`, `is_reply`, `is_reply_owned_by_me`, `hide_status`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `topic_tag`, `is_verified`, `profile_picture_url`, `reply_approval_status` |
| `reverse`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;Whether or not replies should be sorted in reverse chronological order.  &lt;br&gt;**Values:** `true` *(default)*, `false` |
| `before` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `POST /&#123;threads-reply-id&#125;/manage_pending_reply`

Approve or ignore a pending reply on your Threads post. See [Reply Approvals](https://developers.facebook.com/documentation/threads/reply-management#reply-approvals) for more information.

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-reply-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads reply media identifier. |
| `approve`&lt;br&gt;&lt;br&gt;Boolean | **Required.**  &lt;br&gt;Set to `true` to approve a reply, and set to `false` to ignore a reply.  &lt;br&gt;**Values:** `true`, `false` |

