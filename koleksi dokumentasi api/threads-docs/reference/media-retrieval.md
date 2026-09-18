> This page location: Threads API > threads/reference/media-retrieval
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/media-retrieval

# Media Retrieval



You can retrieve Threads media objects by individual ID or by searching on a keyword. See [Retrieve Threads Media Objects](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts) and [Keyword Search](https://developers.facebook.com/documentation/threads/keyword-search) for more information on each method.

## `GET /&#123;threads-media-id&#125;`
Retrieve a Threads media object. See [Retrieve a Single Threads Media Object](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#retrieve-a-single-threads-media-object) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `owner`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`, `alt_text`, `link_attachment_url`, `has_replies`, `is_reply`, `is_reply_owned_by_me`, `root_post`, `replied_to`, `hide_status`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `poll_attachment`, `topic_tag`, `is_spoiler_media`, `text_entities`, `text_attachment`, `location_id` |

## `GET /keyword_search`

Search for public Threads media with specific keywords or topic tags. See [Keyword Search](https://developers.facebook.com/documentation/threads/keyword-search) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `q`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The keyword(s) to be queried. |
| `search_type`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Specifies the search behavior.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `TOP` (*default*) — To get the most popular search results.&lt;br&gt;* `RECENT` — To get the most recent search results. |
| `search_mode`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Specifies the search mode.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `KEYWORD` (*default*) — The query will be treated as a keyword.&lt;br&gt;* `TAG` — The query will be treated as a topic tag. |
| `media_type`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Specifies the type of media to search for. Only the media type values listed below are supported.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `TEXT` — The query will search for text posts.&lt;br&gt;* `IMAGE` — The query will search for image posts.&lt;br&gt;* `VIDEO` — The query will search for video posts. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `media_product_type`, `media_type`, `media_url`, `permalink`, `username`, `text`, `timestamp`, `shortcode`, `thumbnail_url`, `children`, `is_quote_post`, `alt_text`, `link_attachment_url`, `has_replies`, `is_reply`, `root_post`, `replied_to`, `reply_audience`, `quoted_post`, `reposted_post`, `gif_url`, `poll_attachment`, `topic_tag` |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `author_username` | **Optional.**  &lt;br&gt;Filters search results to include only posts created by the specified username or profile. The username must be an exact match without the `&#064;` symbol. |

