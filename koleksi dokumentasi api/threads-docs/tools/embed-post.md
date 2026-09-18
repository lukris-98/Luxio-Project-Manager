> This page location: Threads API > threads/tools-and-resources/embed-a-threads-post
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/tools-and-resources/embed-a-threads-post

# Embed a Threads Post



You can use the Threads oEmbed endpoint to retrieve the embed HTML code snippet and essential metadata for a public Threads post, allowing you to render and display a rich preview of the post on an external website or application. Text, image, video, and carousel posts are supported.

### Common Use Cases

* Embed a post in a blog.
* Embed a post in a website.
* Render a post in a content management system.

### Limitations

* The Threads oEmbed endpoint is only intended to be used for embedding Threads content in websites and apps. It is not to be used for any other purpose. Using metadata and post content (or their derivations) from the endpoint for any purpose other than providing a front-end view of the post is strictly prohibited. This prohibition encompasses consuming, manipulating, extracting, or persisting the metadata and content, including but not limited to, deriving information about posts from the metadata for analytics purposes.
* Posts on private, inactive, and age-restricted accounts as well as geo-gated posts are not supported.

### Rate Limits

* You can make up to 1,000 requests every hour.

## Get the Embed HTML Code

You can fetch the embed HTML code programmatically via the API or from [threads.com](https://threads.com) by clicking on a post&#039;s share icon and selecting the **&quot;Get embed code&quot;** button.

To get a Threads post&#039;s embed HTML code using the API, send a request to the `/oembed` endpoint:

```
GET /oembed?url=&lt;URL_OF_THE_POST&gt;
```

* `URL_OF_THE_POST` — The permalink of the Threads post that you want to query.

Upon success, the API will respond with a JSON object containing the post&#039;s embed HTML code and additional metadata. The embed HTML code will be in the returned `html` field.

Refer to the [Threads oEmbed reference](https://developers.facebook.com/documentation/threads/reference/oembed) for a list of query string parameters you can include to augment the request.

### Example Requests

```
curl -X GET \ &quot;https://graph.threads.net/v1.0/oembed?url=&lt;URL_OF_THE_POST&gt;&quot;
```

### Example Response

Default fields that are returned:

```
&#123;
  &quot;type&quot;: &quot;rich&quot;,
  &quot;version&quot;: &quot;1.0&quot;,
  &quot;html&quot;: &quot;&lt;blockquote class=\&quot;text-post-media\&quot; data-text-post-permalink=...&quot;,
  &quot;provider_name&quot;: &quot;Threads&quot;,
  &quot;provider_url&quot;: &quot;https://www.threads.com/&quot;,
  &quot;width&quot;: 658
&#125;
```

### URL Formats

The `url` query string parameter accepts the following URL formats:

```html
https://www.threads.com/&#064;&#123;username&#125;/post/&#123;media-shortcode&#125;/
```

```html
https://www.threads.com/t/&#123;media-shortcode&#125;/
```

### Embed JS

The embed HTML contains a reference to the Threads embed.js JavaScript library. When the library loads, it scans the page for the post HTML and generates the fully rendered post.

```javascript
&lt;script async src=&quot;https://www.threads.com/embed.js&quot;&gt;&lt;/script&gt;
```

### Post Size

The embedded post is responsive and will adapt to the size of its container. This means that the height will vary depending on the container width and the length of the post content. You can set the maximum width by including the `maxwidth` query string parameter in your request.

**Note:** The `maxwidth` must be between 320 and 658 pixels.
