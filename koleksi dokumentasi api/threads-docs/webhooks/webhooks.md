> This page location: Threads API > threads/webhooks
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/webhooks

# Webhooks for Threads



Webhooks for Threads allow you to receive real-time notifications for the subscribed topics and fields.

## Receive Live Webhook Notifications

To receive live webhook notifications, the following conditions must be satisfied:

- Your app must have Threads webhooks added as a sub-use case and appropriate fields subscribed to in the App Dashboard.

- For non-tech providers, the apps must be in [Live Mode](https://developers.facebook.com/documentation/development/build-and-test/app-modes).

- For tech providers, the apps must have permissions with an [Advanced Access level](https://developers.facebook.com/docs/graph-api/overview/access-levels). You can request Advanced Access for permissions as shown here:

If the app permissions don&#039;t have an access level of Advanced Access, the app won&#039;t receive webhook notifications.

- The app user must have granted your app appropriate permissions (i.e., `threads_basic`, `threads_read_replies` for reply webhooks).

- The business connected to the app must be verified.

- To receive real-time [reply](#real-time-reply-notifications) and [mention](#real-time-mention-notifications) notifications, the owner of the media object upon which the webhook event occurs must not have set their account to private.

- To receive real-time [delete](#real-time-delete-notifications) and [publish](#real-time-publish-notifications) notifications, the owner of the media object upon which the webhook event occurs must be a public account or private account that authenticated to the app.

### Limitations

* Apps don&#039;t receive webhook notifications if the media where the reply or mention appears was created by a private account.
* Your app must have successfully completed App Review ([Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels)) to receive webhooks notifications for all of the fields.

### Step 0: [Optional] Use the sample app to test your integration

Download the [webhooks sample app](https://github.com/fbsamples/graph-api-webhooks-samples/) to test your integration.

### Step 1: Add the webhooks sub-use case to the main Threads API use case

Under **Use Cases** &gt; **Customize** &gt; **Settings**, add the **Get real-time notifications with Threads Webhooks** sub-use case.

### Step 2: Create an endpoint and configure Threads webhooks

[Create an endpoint](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) that accepts and processes webhooks. To add the configuration:

1. Select the desired topic, and click **Subscribe to this object**.
2. Set the callback URL and token.

The token here is passed to your server defined in the callback URL to allow verification that the call originates from Meta servers.

#### Webhook Topics

##### Moderate topic fields

| Name | Description |
| --- | --- |
| `replies` | [Replies](https://developers.facebook.com/documentation/threads/retrieve-and-manage-replies/replies-and-conversations#a-thread-s-replies) on a [Threads Media](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts) owned by the Threads install user.  &lt;br&gt;**Required permission(s):** [`threads_basic`](https://developers.facebook.com/docs/permissions#threads_basic), [`threads_read_replies`](https://developers.facebook.com/docs/permissions#threads_read_replies) |
| `delete` | Threads posts that were [deleted](https://developers.facebook.com/documentation/threads/posts/delete-posts) by the authenticated user.  &lt;br&gt;**Required permissions:** [`threads_basic`](https://developers.facebook.com/docs/permissions#threads_basic), [`threads_delete`](https://developers.facebook.com/docs/permissions#threads_delete) |

##### Interaction topic fields

| Name | Description |
| --- | --- |
| `mentions` | [Mentions](https://developers.facebook.com/documentation/threads/threads-mentions) on a public [Threads Media](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts) tagging the Threads install user.  &lt;br&gt;**Required permission(s):** [`threads_basic`](https://developers.facebook.com/docs/permissions#threads_basic), [`threads_manage_mentions`](https://developers.facebook.com/docs/permissions#threads_manage_mentions)  &lt;br&gt;**Optional permission(s):** [`threads_read_replies`](https://developers.facebook.com/docs/permissions#threads_read_replies) — required for the `has_replies`, `is_reply`, `replied_to`, and `root_post` fields. Without this permission, these fields will be removed from the webhook response. |
| `publish` | Threads posts that were [published](https://developers.facebook.com/documentation/threads/posts) by the authenticated user (including replies to user&#039;s or other&#039;s posts).  &lt;br&gt;**Required permissions:** `threads_basic` |

## Notification Formats

### Fields

| Name | Description |
| --- | --- |
| `app_id` | The Threads App ID displayed in **App Dashboard** &gt; **App settings** &gt; **Basic** &gt; **Threads App ID**. |
| `topic` | Name of the Webhook topic.  &lt;br&gt;We support moderate and interaction topics. |
| `target_id` | The media’s ID for a `reply` or `delete` webhook, or the mentioned Threads user app-scoped user ID for a `mentions` webhook. |
| `time` | Time when the real-time notification is sent. |
| `subscription_id` | The subscription ID for the user in the webhook. |
| `id` | The media&#039;s ID. |
| `deleted_at` | Time when the post was deleted in ISO 8601 format. |
| `timestamp` | Time when the post was published in ISO 8601 format. |

### Real-time reply notifications

If you subscribe to the `replies` field, we send your endpoint a webhook notification containing the reply object.

#### Sample replies payload

```json
&#123;
    &quot;app_id&quot;: &quot;123456&quot;,
    &quot;topic&quot;: &quot;moderate&quot;,
    &quot;target_id&quot;: &quot;78901&quot;,
    &quot;time&quot;: 1723226877,
    &quot;subscription_id&quot;: &quot;234567&quot;,
    &quot;has_uid_field&quot;: false,
    &quot;values&quot;: &#123;
        &quot;value&quot;: &#123;
            &quot;id&quot;: &quot;8901234&quot;,
            &quot;username&quot;: &quot;test_username&quot;,
            &quot;text&quot;: &quot;Reply&quot;,
            &quot;media_type&quot;: &quot;TEXT_POST&quot;,
            &quot;permalink&quot;: &quot;https:\/\/www.threads.net\/&#064;test_username\/post\/Pp&quot;,
            &quot;replied_to&quot;: &#123;
                &quot;id&quot;: &quot;567890&quot;
            &#125;,
           &quot;root_post&quot;: &#123;
               &quot;id&quot;: &quot;123456&quot;,
               &quot;owner_id&quot;: &quot;123456&quot;,
               &quot;username&quot;: &quot;test_username_2&quot;
           &#125;,
            &quot;shortcode&quot;: &quot;Pp&quot;,
            &quot;timestamp&quot;: &quot;2024-08-07T10:33:16+0000&quot;
        &#125;,
        &quot;field&quot;: &quot;replies&quot;
    &#125;
&#125;
```

**Note:** Additional fields not listed in this sample response that are returned when applicable include `is_verified` and `profile_picture_url`.

### Real-time mention notifications

If you subscribe to the `mentions` field, we send your endpoint a webhook notification containing the media object in which the user is mentioned.

#### Sample mentions payload

```json
&#123;
    &quot;app_id&quot;: &quot;123456&quot;,
    &quot;topic&quot;: &quot;interaction&quot;,
    &quot;target_id&quot;: &quot;78901&quot;,
    &quot;time&quot;: 1723226877,
    &quot;subscription_id&quot;: &quot;234567&quot;,
    &quot;has_uid_field&quot;: false,
    &quot;values&quot;: &#123;
        &quot;value&quot;: &#123;
            &quot;id&quot;: &quot;8901234&quot;,
            &quot;alt_text&quot;: &quot;test alt text&quot;,
            &quot;gif_url&quot;: &quot;https://media2.giphy.com/media/v1.Y2lkPTA1NzQyMTNjd2R0MXcybjZ6bDNyam9qaXJsN3RicnVncnFsanJ2dGk3eDJiejRmbyZlcD12MV9naWZzX2dpZklkJmN0PWc/3o85xEFRBYvAnamJnG/200.gif&quot;,
            &quot;has_replies&quot;: true,
            &quot;is_quote_post&quot;: false,
            &quot;is_reply&quot;: false,
            &quot;media_product_type&quot;: &quot;THREADS&quot;,
            &quot;media_type&quot;: &quot;TEXT_POST&quot;,
            &quot;permalink&quot;: &quot;https:\/\/www.threads.net\/&#064;test_username\/post\/Pp&quot;,
            &quot;shortcode&quot;: &quot;Pp&quot;,
            &quot;text&quot;: &quot;Reply&quot;,
            &quot;timestamp&quot;: &quot;2024-08-07T10:33:16+0000&quot;
            &quot;username&quot;: &quot;test_username&quot;,
        &#125;,
        &quot;field&quot;: &quot;mentions&quot;
    &#125;
&#125;
```

**Note:** Additional fields not listed in this sample response that are returned when applicable include `media_url`, `poll_attachment`, `quoted_post`, `replied_to`, `reposted_post`, `root_post`, `is_verified`, `profile_picture_url`, and `thumbnail_url`.

### Real-time delete notifications

If you subscribe to the `delete` field, we send your endpoint a webhook notification containing the media object when it&#039;s deleted.

#### Sample delete payload

```json
&#123;
    &quot;app_id&quot;: &quot;123456&quot;,
    &quot;topic&quot;: &quot;moderate&quot;,
    &quot;target_id&quot;: &quot;78901&quot;,
    &quot;time&quot;: 1723226877,
    &quot;subscription_id&quot;: &quot;234567&quot;,
    &quot;has_uid_field&quot;: false,
    &quot;values&quot;: &#123;
        &quot;value&quot;: &#123;
            &quot;id&quot;: &quot;8901234&quot;,
            &quot;owner&quot;: &#123;
               &quot;owner_id&quot;: &quot;78901&quot;,
            &#125;,
            &quot;deleted_at&quot;: &quot;2024-08-07T10:33:16+0000&quot;
            &quot;timestamp&quot;: &quot;2024-08-07T10:33:16+0000&quot;
            &quot;username&quot;: &quot;test_username&quot;,
        &#125;,
        &quot;field&quot;: &quot;delete&quot;
    &#125;
&#125;
```

### Real-time publish notifications

If you subscribe to the `publish` field, we send your endpoint a webhook notification containing the media object when it&#039;s published (including replies to user&#039;s or other&#039;s posts).

#### Sample publish payload

```json
&#123;
    &quot;app_id&quot;: &quot;123456&quot;,
    &quot;topic&quot;: &quot;interaction&quot;,
    &quot;target_id&quot;: &quot;78901&quot;,
    &quot;time&quot;: 1723226877,
    &quot;subscription_id&quot;: &quot;234567&quot;,
    &quot;has_uid_field&quot;: false,
    &quot;values&quot;: &#123;
        &quot;value&quot;: &#123;
            &quot;id&quot;: &quot;8901234&quot;,
            &quot;media_type&quot;: &quot;TEXT_POST&quot;
            &quot;permalink&quot;: &quot;https:\/\/www.threads.net\/&#064;test_username\/post\/Pp&quot;,
            &quot;timestamp&quot;: &quot;2024-08-07T10:33:16+0000&quot;
            &quot;username&quot;: &quot;test_username&quot;,
        &#125;,
        &quot;field&quot;: &quot;publish&quot;
    &#125;
&#125;
```
