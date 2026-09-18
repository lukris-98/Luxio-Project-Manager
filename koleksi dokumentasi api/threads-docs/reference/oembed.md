> This page location: Threads API > threads/reference/oembed
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/oembed

# oEmbed



You can retrieve the embed HTML code and associated metadata of public Threads posts.

## `GET /oembed?url=...`

Retrieve the embed HTML of a public Threads post. See [Embed a Threads Post](https://developers.facebook.com/documentation/threads/tools-and-resources/embed-a-threads-post) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `url`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Permanent link to the post on Threads.&lt;br&gt;&lt;br&gt;**Accepted formats:**&lt;br&gt;&lt;br&gt;* `https://www.threads.com/&#064;&#123;username&#125;/post/&#123;media-shortcode&#125;`&lt;br&gt;* `https://www.threads.com/t/&#123;media-shortcode&#125;`&lt;br&gt;&lt;br&gt;**Examples:**&lt;br&gt;&lt;br&gt;* https://www.threads.com/&#064;meta/post/DDzbnVKx57R&lt;br&gt;* https://www.threads.com/t/DDzbnVKx57R |
| `maxwidth`&lt;br&gt;&lt;br&gt;int64 | **Optional.**  &lt;br&gt;Maximum width of returned media. Must be between 320 and 658. **Note:** The `maxheight` parameter is not supported because the embed code is responsive and its height varies depending on its width. |

### Fields

| Name | Description |
| --- | --- |
| `html`&lt;br&gt;&lt;br&gt;string | The HTML used to display the post. |
| `provider_name`&lt;br&gt;&lt;br&gt;string | Name of the provider (Threads). |
| `provider_url`&lt;br&gt;&lt;br&gt;string | URL of the provider ([https://www.threads.com/](https://www.threads.com/)). |
| `type`&lt;br&gt;&lt;br&gt;string | The oEmbed resource type. See [https://oembed.com/](https://oembed.com/). |
| `version`&lt;br&gt;&lt;br&gt;string | Always 1.0. See [https://oembed.com/](https://oembed.com/). |
| `width`&lt;br&gt;&lt;br&gt;int32 | The width in pixels required to display the HTML. |

