> This page location: Threads API > threads/keyword-search
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/keyword-search

# Keyword and Topic Tag Search



Search for public Threads media with specific keywords or by topic tag.

### Limitations

* A user can send a maximum of 2,200 queries within a rolling 24-hour period. Once a query is sent, it will count against this limit for 24 hours.
* This limit applies to a user across apps and is not differentiated for different apps. If multiple apps send requests for the same user, those queries will apply to the same limit for that user.
* Subsequent queries against the same keyword within this timeframe will also count against this limit.
* Queries which return no results do not count against this limit for the user. If no results are returned, consider refining or shortening your query.
* The API will return an empty array for any requests that include keywords that we have deemed sensitive or offensive.

### Permissions

The Threads Keyword Search API requires an appropriate access token and permissions. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.
* `threads_keyword_search` — Required for making GET calls to the keyword search endpoint.

If your app has not been approved for the `threads_keyword_search` permission, the search will be performed only on posts owned by the authenticated user. After approval, public posts will be searchable.

## Keyword Search

To search for public Threads media by keyword, send a `GET` request to the `/keyword_search` endpoint with a keyword to be queried.

### Parameters

| Name | Description |
| --- | --- |
| `q`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The keyword(s) to be queried. |
| `search_type`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Specifies the search behavior.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `TOP` (*default*) — To get the most popular search results.&lt;br&gt;* `RECENT` — To get the most recent search results. |
| `search_mode`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Specifies the search mode.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `KEYWORD` (*default*) — The query will be treated as a keyword.&lt;br&gt;* `TAG` — The query will be treated as a topic tag. |
| `media_type`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;Specifies the type of media to search for. Only the media type values listed below are supported.&lt;br&gt;&lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `TEXT` — The query will search for text posts.&lt;br&gt;* `IMAGE` — The query will search for image posts.&lt;br&gt;* `VIDEO` — The query will search for video posts. |
| `since` | **Optional.**  &lt;br&gt;Query string parameter representing the start date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be greater than or equal to `1688540400` and less than the `until` parameter). |
| `until` | **Optional.**  &lt;br&gt;Query string parameter representing the end date for retrieval (must be a Unix timestamp or a date/time representation parseable by `strtotime();`, the timestamp must be less than or equal to the current timestamp and greater than the `since` parameter). |
| `limit` | **Optional.**  &lt;br&gt;Query string parameter representing the maximum number of media objects or records requested to return, default is **25** and maximum is **100** (only non-negative numbers are allowed). |
| `author_username` | **Optional.**  &lt;br&gt;Filters search results to include only posts created by the specified username or profile. The username must be an exact match without the `&#064;` symbol. |

See the [Media](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts) documentation for a list of available fields. **Note:** The owner field is excluded and will not be returned.

### Example Request

```
curl -s -X GET \
  -F &quot;q=&lt;KEYWORD&gt;&quot; \
  -F &quot;search_type=TOP&quot; \
  -F &quot;fields=id,text,media_type,permalink,timestamp,username,has_replies,is_quote_post,is_reply&quot; \
  -F &quot;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/keyword_search&quot;
```

### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;1234567890&quot;,
      &quot;text&quot;: &quot;first thread&quot;,
      &quot;media_type&quot;: &quot;TEXT&quot;,
      &quot;permalink&quot;: &quot;https://www.threads.net/&#064;&lt;USER&gt;/post/abcdefg&quot;,
      &quot;timestamp&quot;: &quot;2023-10-17T05:42:03+0000&quot;,
      &quot;username&quot;: &quot;&lt;USER&gt;&quot;,
      &quot;has_replies&quot;: false,
      &quot;is_quote_post&quot;: false,
      &quot;is_reply&quot;: false
    &#125;
  ]
&#125;
```

## Topic Tag Search

To search for public Threads media by topic tag, send a `GET` request to the `/keyword_search` endpoint with a topic to be queried. To perform a topic tag search, you need to use the `search_mode` parameter and set the value to `TAG`.

### Example Request

```
curl -s -X GET \
  -F &quot;q=&lt;TAG&gt;&quot; \
  -F &quot;search_mode=TAG&quot; \
  -F &quot;search_type=TOP&quot; \
  -F &quot;fields=id,text,media_type,permalink,timestamp,username,has_replies,is_quote_post,is_reply&quot; \
  -F &quot;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/keyword_search&quot;
```

### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;1234567890&quot;,
      &quot;text&quot;: &quot;second thread&quot;,
      &quot;media_type&quot;: &quot;TEXT&quot;,
      &quot;permalink&quot;: &quot;https://www.threads.net/&#064;&lt;USER&gt;/post/abcdefg&quot;,
      &quot;timestamp&quot;: &quot;2023-10-17T05:42:03+0000&quot;,
      &quot;username&quot;: &quot;&lt;USER&gt;&quot;,
      &quot;has_replies&quot;: false,
      &quot;is_quote_post&quot;: false,
      &quot;is_reply&quot;: false
    &#125;
  ]
&#125;
```

## Search by Media Type

To search for public Threads posts by media type, send a `GET` request to the `/keyword_search` endpoint with the `media_type` parameter. Searches can be done for text, image, and video media types. If the `media_type` parameter is not sent, all media types will be returned in the response.

### Example Request

```
curl -s -X GET \
  -F &quot;q=&lt;KEYWORD&gt;&quot; \
  -F &quot;media_type=IMAGE&quot;
  -F &quot;fields=id,text,media_type,permalink,timestamp,username&quot; \
  -F &quot;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/keyword_search&quot;
```

### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;1234567890&quot;,
      &quot;text&quot;: &quot;third thread&quot;,
      &quot;media_type&quot;: &quot;IMAGE&quot;,
      &quot;permalink&quot;: &quot;https://www.threads.net/&#064;&lt;USER&gt;/post/abcdefg&quot;,
      &quot;timestamp&quot;: &quot;2023-10-17T05:42:03+0000&quot;,
      &quot;username&quot;: &quot;&lt;USER&gt;&quot;
    &#125;
  ]
&#125;
```

## Interacting with Public Threads

You can interact with public Threads media that you have recently searched for. These actions include [replying](https://developers.facebook.com/documentation/threads/reply-management), [quoting](https://developers.facebook.com/documentation/threads/posts/quote-posts), and [reposting](https://developers.facebook.com/documentation/threads/posts/reposts).

**Note:** Additional permissions may be required as listed in those pages.

## Recently Searched Keywords

You can retrieve a list of recently searched keywords for the currently authenticated user by sending a `GET` request to the `/me` endpoint and requesting the `recently_searched_keywords` field.

### Example Request

```
curl -s -X GET \
  -F &quot;fields=recently_searched_keywords&quot; \
  -F &quot;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/me&quot;
```

### Example Response

```
&#123;
  &quot;id&quot;: &quot;1234567890&quot;,
  &quot;recently_searched_keywords&quot;: [
    &#123;
      &quot;query&quot;: &quot;some keyword&quot;,
      &quot;timestamp&quot;: 1735707600000,
    &#125;,
    &#123;
      &quot;query&quot;: &quot;some other keyword&quot;,
      &quot;timestamp&quot;: 1735707600000,
    &#125;
  ]
&#125;
```
