> This page location: Facebook Pages API > pages-api/webhooks-for-pages
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/webhooks-for-pages

# Webhooks for Pages


**Warning:** The following content is from the [Webhooks product documentation](https://developers.facebook.com/docs/graph-api/webhooks). Please refer to the Webhooks documentation if you are unfamiliar with Webhooks.

Webhooks for [Pages](https://developers.facebook.com/documentation/pages-api) can send you real-time notifications of changes to your Pages. For example, you can receive real-time updates whenever users post to your feed, comment on a post, or like your posts.

To set up a Page Webhook:

1. [Set up your endpoint and configure the Webhooks product](#set-up-endpoint-and-product).
1. [Install your app](#install-app) using your Facebook page.

## Setting Up Your Endpoint and Webhook Product &#123;#set-up-endpoint-and-product&#125;

Follow our [Getting Started guide](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) to create your endpoint and configure the Webhooks product. During configuration, make sure to choose the **Page** object and subscribe to one or more of the Pages fields below.

| Field | Description |
| --- | --- |
| `feed` | Notifies you when an Page&#039;s feed has changed; posts, reactions, shares, etc. |
| `messages` | Notifies you when your page has received a message via Messenger. See the [Webhooks for Messenger guide](https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks#events) for a list of all available messages webhooks fields&lt;br&gt; |

## Install Your App &#123;#install-app&#125;

Webhook notifications will only be sent if your Page has installed your Webhooks configured-app, and if the Page has not disabled the **App** platform in its [App Settings](https://www.facebook.com/settings?tab=applications). To get your Page to install the app, have your app send a `POST` request to the Page&#039;s [subscribed_apps](https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps) edge using the Page&#039;s acccess token.

### Requirements

- A Page access token requested from a person who can perform the
[`CREATE_CONTENT`, `MANAGE`, or `MODERATE` task](https://developers.facebook.com/documentation/pages-api/overview#tasks) on the Page being queried

- The
[`pages_manage_metadata` and `pages_show_list` permissions](https://developers.facebook.com/documentation/pages-api/overview#permission-dependencies)
are required for the `feed` webhooks

- The [`pages_messaging`](https://developers.facebook.com/documentation/pages-api/overview#permission-dependencies) is also required for the `messages`

For the messages related fields only

* A Page access token requested from a person who can perform the [`MESSAGING` task](https://developers.facebook.com/documentation/pages-api/overview#tasks) on the Page being queried
* [`pages_messaging`](https://developers.facebook.com/docs/permissions/reference/pages_messaging)

#### Sample Request

```
curl -i -X POST &quot;https://graph.facebook.com/&#123;page-id&#125;/subscribed_apps
  ?subscribed_fields=feed
  &amp;access_token=&#123;page-access-token&#125;&quot;
```

#### Sample Response

```js
&#123;
  &quot;success&quot;: &quot;true&quot;
&#125;
```

To see which app&#039;s your Page has installed, send a `GET` request instead:

#### Sample Request

```html
curl -i -X GET &quot;https://graph.facebook.com/&#123;page-id&#125;/subscribed_apps
  &amp;access_token=&#123;page-access-token&#125;
```

#### Sample Response

```js
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;category&quot;: &quot;Business&quot;,
      &quot;link&quot;: &quot;https://my-clever-domain-name.com/app&quot;,
      &quot;name&quot;: &quot;My Sample App&quot;,
      &quot;id&quot;: &quot;&#123;page-id&#125;&quot;
    &#125;
  ]
&#125;
```

If your Page has not installed any apps, the API will return an empty data set.

#### Graph API Explorer

If you don&#039;t want to install your app programmatically, you can easily do it with the [Graph API Explorer](https://developers.facebook.com/tools/explorer) instead:

1. Select your app in the **Application** dropdown menu. This will return your app&#039;s access token.
1. Click the **Get Token** dropdown and select **Get User Access Token**, then choose the `pages_manage_metadata` permission. This will exchange your app token for a User access token with the `pages_manage_metadata` permission granted.
1. Click **Get Token** again and select your Page. This will exchange your User access token for a Page access token.
1. Change the operation method by clicking the `GET` dropdown menu and selecting `POST`.
1. Replace the default `me?fields=id,name` query with the Page&#039;s **id** followed by `/subscribed_apps`, then submit the query.  

## Common Uses &#123;#common-uses&#125;

### Getting Page Feed Details

Your app can subscribe to a Page&#039;s Feed and get notified anytime any Feed-related change occurs. For example, here&#039;s a notification sent when a User posted to a Page.

#### Sample Webhook Response

```js
[
  &#123;
    &quot;entry&quot;: [
      &#123;
        &quot;changes&quot;: [
          &#123;
            &quot;field&quot;: &quot;feed&quot;,
            &quot;value&quot;: &#123;
              &quot;from&quot;: &#123;
                &quot;id&quot;: &quot;&#123;user-id&#125;&quot;,
                &quot;name&quot;: &quot;Cinderella Hoover&quot;
              &#125;,
              &quot;item&quot;: &quot;post&quot;,
              &quot;post_id&quot;: &quot;&#123;page-post-id&#125;&quot;,
              &quot;verb&quot;: &quot;add&quot;,
              &quot;created_time&quot;: 1520544814,
              &quot;is_hidden&quot;: false,
              &quot;message&quot;: &quot;It&#039;s Thursday and I want to eat cake.&quot;
            &#125;
          &#125;
        ],
        &quot;id&quot;: &quot;&#123;page-id&#125;&quot;,
        &quot;time&quot;: 1520544816
      &#125;
    ],
    &quot;object&quot;: &quot;page&quot;
  &#125;
]
```

Use the `post_id` from the notification to [comment on that Page post](https://developers.facebook.com/documentation/pages-api/posts#comment_on_post).

#### Sample API Request

```curl
curl -i -X POST   &quot;https://graph.facebook.com/&#123;page-post-id&#125;/comments
  ?message=I%20want%20chocolate%20cake%20!
  &amp;access_token=page-access-token&quot;
```

#### Sample API Response

```js
&#123;
  &quot;id&quot;: &quot;&#123;comment-id&#125;&quot;
&#125;
```

