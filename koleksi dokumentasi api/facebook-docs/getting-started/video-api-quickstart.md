> This page location: Facebook Video API > video-api/getting-started
> Source: https://developers.facebook.com/documentation/video-api/getting-started

# Get Started



The Get Started with the Facebook Video API from Meta guide shows you how to obtain a permissions, a Page access token, and a Page ID using the Graph API Explorer.

## Before You Start

You will need:

- [A Meta app](https://developers.facebook.com/documentation/development/create-an-app)

- [A Facebook Page](https://developers.facebook.com/documentation/pages-api/overview#tasks) that you are able to perform the `CREATE_CONTENT` task

- [The Graph API Explorer tool](https://developers.facebook.com/docs/graph-api/guides/explorer) to run API requests

- A Video handle ID for the video that you have uploaded to Meta servers using the
[Resumble Upload API.](https://developers.facebook.com/docs/graph-api/guides/upload)

**Warning:** The `graph-video.facebook.com` host for video uploads has been deprecated. Use the `graph.facebook.com` host for API requests when uploading videos to Meta servers.

## Step 1: Get an access token

In this section you will beusing the Graph API Explorer to get an access token for your Page with the necessary permissions

- Load the [**Graph API Explorer** in a new window.](https://developers.facebook.com/tools/explorer/)

- Select your app from the **Meta App** dropdown menu.

- In the **User or Page** drop-down menu, select **User Token**.

- In the **Permissions** section, use the **Add a permission** search field to search for and select the following permissions:

- `pages_manage_engagement`

- `pages_read_user_content`

- `pages_show_list`

- Click **Generate Access Token**.

- In the pop-up window that appears, select the Page where you want to publish your video and complete the pop-up window flow.

You now have a User access token that you can use to make API requests. You can copy and paste this token to test your app and click the **i** icon to view details about this token including permissions and expiry.

## Step 2: Get your Page ID and token

- In the Graph API Explorer, update the query string field a request to the `GET /me/accounts` endpoint. **`me`** represents the ID for the User or Page that requested the access token, in this query the ID is your User ID.

- Click **Submit** in the upper right. A list of Page objects will be returned, including the name, Page ID, and Page access token, for Facebook pages on which you can perform a task.

- Copy the ID for your Page and Page access token.

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;access_token&quot;: &quot;EBACf...&quot;,  //Copy your Page Access Token
      &quot;category&quot;: &quot;Media&quot;,
      &quot;category_list&quot;: [
        &#123;
          &quot;id&quot;: &quot;163003840417682&quot;,
          &quot;name&quot;: &quot;Media&quot;
        &#125;
      ],
      &quot;name&quot;: &quot;Metricsaurus&quot;,
      &quot;id&quot;: &quot;1755847768034402&quot;,  //Copy your Page ID
      &quot;tasks&quot;: [
        &quot;ANALYZE&quot;,
        &quot;ADVERTISE&quot;,
        &quot;MODERATE&quot;,
        &quot;CREATE_CONTENT&quot;,
        &quot;MANAGE&quot;
      ]
    &#125;
  ],
  &quot;paging&quot;: &#123;
    &quot;cursors&quot;: &#123;
      &quot;before&quot;: &quot;MTc1NTg0Nzc2ODAzNDQwMgZDZD&quot;,
      &quot;after&quot;: &quot;MTc1NTg0Nzc2ODAzNDQwMgZDZD&quot;
    &#125;
  &#125;
&#125;
```

## Step 3. Publish the video to your Page

- In the explorer, replace **`me`** with your Page ID.

- Replace the access token with your Page access token.

