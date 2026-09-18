> This page location: Threads API > threads/threads-web-intents
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/threads-web-intents

# Web Intents



Web intents offer a simple way for people to interact with Threads directly from your website, starting with the ability to quickly create posts and follow profiles.

When clicking on a Web intent URL, a new window opens and users are directed to Threads to complete the intended action. On mobile (iOS and Android), web intents will open the Threads app whenever it is installed. If they are not already logged-in, they will have the opportunity to sign in or create a Threads account.

When linking intents to an image, we recommend using the Threads logo available in our [Threads Brand Resources](https://about.meta.com/brand/resources/instagram/threads/).

## Post Intent

Post intents allow people to easily share their favorite content from your website directly to Threads, in order to increase your reach, spark conversations and drive traffic.

### URL Format

The URL format is [https://www.threads.com/intent/post](https://www.threads.com/intent/post).

### Supported Parameters

The post intent flow supports the following query string parameters.

| Name | Description |
| --- | --- |
| `text` | **Optional.**  &lt;br&gt;The text that the post dialog should be prefilled with. |
| `url` | **Optional.**  &lt;br&gt;The URL for an optional link attachment. |
| `tag` | **Optional.**  &lt;br&gt;The topic tag that the post dialog should be prefilled with.&lt;br&gt;&lt;br&gt;**Note:** Newlines, tabs, periods (.), and ampersands (&amp;) are not allowed in topic tags. The maximum length of a valid topic tag is 50 characters. |
| `reply_control` | **Optional.**  &lt;br&gt;The initial audience that is allowed to reply to a post.&lt;br&gt;&lt;br&gt;**Values:** `everyone`, `accounts_you_follow`, `mentioned_only`, `followers_only` |
| `reply_post_shortcode` | **Optional.**  &lt;br&gt;The shortcode of the parent post that you are replying to. When this parameter is included, it will open the Threads post composer in reply mode with the parent post visible. |
| `quote_post_shortcode` | **Optional.**  &lt;br&gt;The shortcode of the post that is being quoted. When this parameter is included, it will open the Threads post composer with the quoted post attached. |

All parameter values should be encoded using [percent-encoding](https://datatracker.ietf.org/doc/html/rfc3986#section-2.1) (&quot;URL encoding&quot;) so that the values can safely be passed via the URL.

### Examples

| Example | URL |
| --- | --- |
| Only text | [https://www.threads.com/intent/post?text=Say+more+with+Threads+%E2%80%94+Instagram%27s+new+text+app](https://www.threads.com/intent/post?text=Say+more+with+Threads+%E2%80%94+Instagram%27s+new+text+app) |
| Only link attachment | [https://www.threads.com/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F](https://www.threads.com/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F) |
| Link attachment and text | [https://www.threads.com/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F&amp;text=Introducing+Threads%3A+A+New+Way+to+Share+With+Text](https://www.threads.com/intent/post?url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F&amp;text=Introducing+Threads%3A+A+New+Way+to+Share+With+Text) |
| Only tag | [https://www.threads.com/intent/post?tag=Threads](https://www.threads.com/intent/post?tag=Threads) |
| Only reply audience | [https://www.threads.com/intent/post?reply_control=followers_only](https://www.threads.com/intent/post?reply_control=followers_only) |
| Reply audience, tag, link attachment, and text | [https://www.threads.com/intent/post?reply_control=followers_only&amp;tag=Threads&amp;url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F&amp;text=Introducing%20Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text](https://www.threads.com/intent/post?reply_control=followers_only&amp;tag=Threads&amp;url=https%3A%2F%2Fabout.fb.com%2Fnews%2F2023%2F07%2Fintroducing-threads-new-app-text-sharing%2F&amp;text=Introducing%20Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text) |
| Reply post and text | [https://www.threads.com/intent/post?reply_post_shortcode=DRM8DF9AGUc&amp;text=Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text](https://www.threads.com/intent/post?reply_post_shortcode=DRM8DF9AGUc&amp;text=Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text) |
| Quote post and text | [https://www.threads.com/intent/post?quote_post_shortcode=DPgzLZcAJPr&amp;text=Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text](https://www.threads.com/intent/post?quote_post_shortcode=DPgzLZcAJPr&amp;text=Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text) |
| Reply post, quote post, and text | [https://www.threads.com/intent/post?reply_post_shortcode=DRM8DF9AGUc&amp;quote_post_shortcode=DPgzLZcAJPr&amp;text=Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text](https://www.threads.com/intent/post?reply_post_shortcode=DRM8DF9AGUc&amp;quote_post_shortcode=DPgzLZcAJPr&amp;text=Threads%3A%20A%20New%20Way%20to%20Share%20With%20Text) |

## Follow Intent

Follow intents allow people to easily follow a Threads account directly from your website.

### URL Format

The URL format is [https://www.threads.com/intent/follow](https://www.threads.com/intent/follow).

### Supported Parameters

| Name | Description |
| --- | --- |
| `username` | **Required.**  &lt;br&gt;The username of the user to follow. |

### Examples

| Example | URL |
| --- | --- |
| The official &#064;threads account | [https://www.threads.com/intent/follow?username=threads](https://www.threads.com/intent/follow?username=threads) |

