> This page location: Threads API > threads/reference/user
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/user

# User



The Threads user endpoints allow you to retrieve a Threads user&#039;s posts, publishing limit, and profile. See [Threads Profiles](https://developers.facebook.com/documentation/threads/threads-profiles) for more information.

## `GET /&#123;threads-user-id&#125;/threads`
Retrieve a paginated list of all Threads posts created by a user. See [Retrieve a List of an App-Scoped User&#039;s Threads](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#retrieve-a-list-of-an-app-scoped-user-s-threads) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `owner`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`,  `alt_text`, `link_attachment_url`, `has_replies`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `is_spoiler_media`, `text_entities`, `text_attachment`, `is_verified`, `profile_picture_url` |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `before` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `GET /&#123;threads-user-id&#125;?fields=id,username,...`

Retrieve profile information about a user on Threads. See [Retrieve a Threads App-Scoped User&#039;s Profile Information](https://developers.facebook.com/documentation/threads/threads-profiles#retrieve-a-threads-user-s-profile-information) for more information.

### Parameters
| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `username`, `name`, `threads_profile_picture_url`, `threads_biography`, `is_verified`, `recently_searched_keywords` |

## `GET /profile_lookup?username=...`

Look up a public profile and retrieve their basic profile information. See [Retrieve a Threads User&#039;s Public Profile Information](https://developers.facebook.com/documentation/threads/threads-profiles#retrieve-a-threads-user-s-public-profile-information) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `username`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Handle or unique username on Threads. Must be an exact match. |

## `GET /profile_posts?username=...`

Look up a public profile and retrieve their posts on Threads. See [Retrieve a List of a Public Profile&#039;s Threads](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#retrieve-a-list-of-a-public-profile-s-threads) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `username`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Handle or unique username on Threads. Must be an exact match. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`,  `alt_text`, `link_attachment_url`, `has_replies`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `is_spoiler_media`, `text_entities` |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `before` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `GET /&#123;threads-user-id&#125;/threads_publishing_limit`
Check the app user&#039;s current publishing rate limit usage. See [Rate Limiting](https://developers.facebook.com/documentation/threads/overview#rate-limiting) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `quota_usage` *(default)*, `config`, `reply_quota_usage`, `reply_config`, `delete_quota_usage`, `delete_config`, `location_search_quota_usage`, `location_search_config` |

## `GET /&#123;threads-user-id&#125;/replies`

Retrieve a paginated list of all Threads replies created by a user. See [Retrieve a List of All a User&#039;s Replies](https://developers.facebook.com/documentation/threads/reply-management#retrieve-a-list-of-all-a-user-s-replies) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`, `has_replies`, `root_post`, `replied_to`, `is_reply`, `is_reply_owned_by_me`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `is_verified`, `profile_picture_url` |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `before` | **Optional.**&lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `GET /&#123;threads-user-id&#125;/mentions`

Retrieve a paginated list of all Threads posts where a user is mentioned. See [Mentions](https://developers.facebook.com/documentation/threads/threads-mentions) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the [fields](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#fields) to be returned. If omitted, default fields will be returned. |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `before` | **Optional.**&lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

## `GET /&#123;threads-user-id&#125;/ghost_posts`

Retrieve a paginated list of all Threads ghost posts created by a user. See [Retrieve a List of an App-Scoped User&#039;s Ghost Posts](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#retrieve-a-list-of-an-app-scoped-user-s-ghost-posts) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the [fields](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#fields) to be returned. If omitted, default fields will be returned. |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `before` | **Optional.**&lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |
| `after` | **Optional.**  &lt;br&gt;Query string parameter representing a cursor that can be used for pagination, both `before` and `after` parameters cannot be passed at the same time. |

