> This page location: Facebook Pages API > pages-api/getting-started
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/getting-started

# Get Started



This document explains how to successfully call the Pages API to post to your Page.

## Before You Start

You will need the following:

* A Facebook Page, this can be an unpublished or published Page on which you can perform the `CREATE_CONTENT` task.
* A Page access token for the Page
* The following permissions:
    * `pages_manage_metadata`
    * `pages_manage_posts`
    * `pages_manage_read_engagement`
    * `pages_show_list`

### Best Practices

When testing an API call, you can include the `access_token` parameter set to your access token. However, when making secure calls from your app, use the [access token class.](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#portabletokens)

## Step 1. Get Your Page ID

To get a list of IDs and Page access tokens for Facebook Pages on which you can perform a task, send a `GET` request to `/user_id/accounts` endpoint where `user_id` is your user ID.

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_id**, with your values.*

```curl
curl -i -X GET &quot;https://graph.facebook.com/v25.0/user_id/accounts?access_token=user_access_token&quot;
```

On success, your app receives the following JSON response that includes an array of objects. Each object contains information about a specific Page including the name, ID, a short-lived Page access token, tasks you can perform on the Page, and more:

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;access_token&quot;: &quot;page_access_token&quot;,
      &quot;category&quot;: &quot;Internet Company&quot;,
      &quot;category_list&quot;: [
        &#123;
          &quot;id&quot;: &quot;2256&quot;,
          &quot;name&quot;: &quot;Internet Company&quot;
        &#125;
      ],
      &quot;name&quot;: &quot;Name of this Page&quot;,
      &quot;id&quot;: &quot;page_id&quot;,
      &quot;tasks&quot;: [
        &quot;ANALYZE&quot;,
        &quot;ADVERTISE&quot;,
        &quot;MODERATE&quot;,
        &quot;CREATE_CONTENT&quot;
      ]
    &#125;,
...
```

## Step 2. Publish a post &#123;#post&#125;

To publish a post, send a `POST` request to the `/page_id/feed` endpoint, where `page_id` is the ID for the Page you are publishing to, with the `message` parameter set to your message content and the `access_token` parameter set to the Page access token:

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_id**, with your values.*

```curl
curl -X POST &quot;https://graph.facebook.com/v25.0/page_id/feed&quot; \
     -H &quot;Content-Type: application/json&quot; \
     -d &#039;&#123;
           &quot;message&quot;:&quot;your_message_text&quot;,
           &quot;access_token&quot;:&quot;page_access_token&quot;,
         &#125;&#039;
```

Your post will be published immediately.

On success, your app receives the following JSON response with the ID for the post:

```json
&#123;
  &quot;id&quot;: &quot;page_post_id&quot;
&#125;
```

Visit your
[Facebook Page](https://www.facebook.com)
to view the post.

## Step 3. Verify Your Post

To verify that the post was published to your Page, send a `GET` request to the `/page_id/feed` endpoint:

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_id**, with your values.*

```
curl -i -X GET &quot;https://graph.facebook.com/v25.0/page_id/feed?access_token=page_access_token&quot;
```

On success, your app will receive the following JSON response with an array of objects. Each object includes the post ID, the message content, and the time the post was created:

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;created_time&quot;: &quot;2020-03-25T17:33:34+0000&quot;,
      &quot;message&quot;: &quot;Hello World!&quot;,
      &quot;id&quot;: &quot;422575694827569_917077345377399&quot;
    &#125;,
...
  ]
&#125;
```

## Use the Graph Explorer

The [Graph Explorer tool](https://developers.facebook.com/tools/explorer) is a UI that allows you to experiment with Facebook APIs without adding code to your app or website. You can select permissions, get access tokens, test `GET`, `POST`, and `DELETE` methods, and get code snippets of these queries for Android, iOS, JavaScript, PHP, and cURL.

Note, you will need a [Facebook App ID](https://developers.facebook.com/docs/apps#register) to use the Graph Explorer.

### Step 1. Get Your Page ID

Select the  the `pages_manage_metadata`, `pages_manage_posts`, `pages_manage_read_engagement`, and `pages_show_list` permissions, which ever appear within the Permission dropdown menu, set the `GET` request to the `/me/accounts` endpoint in the query box, and click **Submit**.

Click on the ID of your Page, displayed directly beneath the name of your Page, to move the ID to the query box.

### Step 2. Post as a Page

Under the **User or Page** drop down menu, select the Page access token for your Page. Next, set the method to `POST` with a request to the `/&#123;page-id&#125;/feed` endpoint, then set the **Params** `key` to `message` and the `value` to your post text. Click **Submit**.

On success, the Graph Explorer will show the ID of the Page post.

Visit your [Facebook Page](https://www.facebook.com) to view the post.

### Step 3. Verify Your Post

Send a `GET` request to the `/page-id/feed` endpoint.

On success, the Graph Explorer will display the time the post was created, the text of the post, and the ID of the Page post.

## Next steps

Learn how to get and update information about your Facebook Page include Page details, access tokens, blocked users, and user recommendations, using the [Manage a Facebook Page guide](https://developers.facebook.com/documentation/pages-api/manage-pages).

Learn how to [publish links, photos, and videos to your Page](https://developers.facebook.com/documentation/pages-api/posts).

## See Also

#### Graph API guides

- [Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens)

- [Graph API User Guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

- [Graph Explorer User Guide](https://developers.facebook.com/docs/graph-api/explorer)

- [Pages API Overview – Tasks](https://developers.facebook.com/documentation/pages-api/overview#tasks)

#### References

- [Page Reference](https://developers.facebook.com/docs/graph-api/reference/page)

- [Page Feed Reference](https://developers.facebook.com/docs/graph-api/reference/page/feed)

- [Page Post Reference](https://developers.facebook.com/docs/graph-api/reference/page-post)

- [Permissions Reference](https://developers.facebook.com/docs/permissions)

- [User Accounts Reference](https://developers.facebook.com/docs/graph-api/reference/user/accounts)

