> This page location: Threads API > threads/reply-management
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reply-management

# Reply Management



The Threads Reply Management API allows you manage replies to users&#039; own Threads by [hiding replies](#hide-replies), [controlling who can reply](#control-who-can-reply), and using [reply approvals](#reply-approvals).

## Hide Replies

Use the `/manage_reply` endpoint to hide/unhide any top-level replies. This will automatically hide/unhide all the nested replies. **Note:** Replies nested deeper than the top-level reply cannot be targeted in isolation to be hidden/unhidden.

#### Example Request

```
curl -X POST \
  -F &quot;hide=&#123;true | false&#125;&quot; \
  -F &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/&lt;THREADS_REPLY_ID&gt;/manage_reply&quot;
```

#### Example Response

```
&#123;
 &quot;success&quot;: true
&#125;
```

## Control Who Can Reply

Use the `reply_control` parameter to specify who can reply to a post being created for publishing. This parameter accepts one of the five options: `everyone`, `accounts_you_follow`, `mentioned_only`, `parent_post_author_only`, and `followers_only`.

#### Example Request

```
curl -X POST \
  -F &quot;media_type=&lt;MEDIA_TYPE&gt;&quot; \
  -F &quot;text=&lt;TEXT&gt;&quot; \
  -F &quot;reply_control=accounts_you_follow&quot; \
  -F &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/me/threads&quot;
```

#### Example Response

```
&#123;
 &quot;id&quot;: &quot;1234567890&quot;
&#125;
```

Use the `POST /&#123;threads-user-id&#125;/threads_publish` endpoint to publish the media container ID returned in the previous step. It is recommended to wait on average 30 seconds before publishing a Threads media container to give our server enough time to fully process the upload. See the [media container status endpoint](https://developers.facebook.com/documentation/threads/troubleshooting#publishing-does-not-return-a-media-id) for more details.

#### Parameters

* `creation_id` —  Identifier of the Threads media container created from the `/threads` endpoint.

#### Example Request

```curl
curl -i -X POST \
&quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_publish?creation_id=&lt;MEDIA_CONTAINER_ID&gt;&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```json
&#123;
  &quot;id&quot;: &quot;1234567&quot; // Threads Media ID
&#125;
```

## Reply Approvals

You can create posts with reply approvals enabled using the Threads API. Replies to these posts must be approved to get published and are hidden until then.

### Limitations

* Reply approvals can not be enabled for [ghost posts](https://developers.facebook.com/documentation/threads/create-posts/ghost-posts).

### Create a post with reply approvals enabled

#### Step 1: Create a Threads media container

You can enable reply approvals on a post by making a request to the `POST /&#123;threads-user-id&#125;/threads` endpoint to create a media container with the `enable_reply_approvals` parameter set to `true`.

##### Example request

```html
curl -i -X POST \
  -d &quot;media_type=TEXT&quot; \
  -d &quot;text=&lt;TEXT&gt;&quot; \
  -d &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot; \
  -d &quot;enable_reply_approvals=true&quot; \
&quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads&quot;
```

##### Example response

```json
&#123;
  &quot;id&quot;: &quot;&lt;MEDIA_CONTAINER_ID&gt;&quot;
&#125;
```

#### Step 2: Publish the media container

Use the returned Threads media container ID to [publish your Threads post](https://developers.facebook.com/documentation/threads/posts#step-2--publish-a-threads-media-container) with reply approvals enabled.

### Retrieve pending replies

Make a request to the `GET /&#123;threads-media-id&#125;/pending_replies` endpoint to fetch a paginated list of all pending replies.

The default behavior will return all pending and ignored replies. The `approval_status` parameter can be used to filter which replies get returned.

#### Parameters

| Name | Description |
| --- | --- |
| `reverse`&lt;br&gt;&lt;br&gt;Boolean | **Optional.**  &lt;br&gt;**Values:**&lt;br&gt;&lt;br&gt;* `true` (*default*) — Replies should be sorted in reverse chronological order.&lt;br&gt;* `false` — Replies should be sorted in chronological order. |
| `approval_status`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;**Values:** (*case-sensitive*)&lt;br&gt;&lt;br&gt;* `pending` — Show only pending replies.&lt;br&gt;* `ignored` — Show only ignored replies.&lt;br&gt;&lt;br&gt;**Note:** The default is to show all replies. |

#### Fields

All the [existing fields](https://developers.facebook.com/documentation/threads/retrieve-and-manage-replies/replies-and-conversations) from existing replies endpoints apply with a new field to fetch pending reply approval status.

| Name | Description |
| --- | --- |
| `reply_approval_status` | Approval status of a pending reply.  &lt;br&gt;**Values:** `pending`, `ignored` |

##### Example request

```html
curl -s -X GET \
    -d &quot;fields=id,text,topic_tag,timestamp,media_product_type,media_type,media_url,shortcode,thumbnail_url,children,has_replies,root_post,replied_to,is_reply,hide_status,reply_approval_status&quot; \
    -d &quot;reverse=false&quot; \
    -d &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot;
&quot;https://graph.threads.net/v1.0/&lt;MEDIA_ID&gt;/pending_replies&quot;
```

##### Example response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;&lt;MEDIA_ID&gt;&quot;,
      &quot;text&quot;: &quot;ignored reply&quot;,
      &quot;timestamp&quot;: &quot;&lt;TIMESTAMP&gt;&quot;,
      &quot;media_product_type&quot;: &quot;THREADS&quot;,
      &quot;media_type&quot;: &quot;TEXT_POST&quot;,
      &quot;shortcode&quot;: &quot;&lt;SHORT_CODE&gt;&quot;,
      &quot;has_replies&quot;: false,
      &quot;is_reply&quot;: true,
      &quot;hide_status&quot;: &quot;NOT_HUSHED&quot;,
      &quot;reply_approval_status&quot;: &quot;ignored&quot;
    &#125;,
    &#123;
      &quot;id&quot;: &quot;&lt;MEDIA_ID&gt;&quot;,
      &quot;text&quot;: &quot;pending reply&quot;,
      &quot;timestamp&quot;: &quot;&lt;TIMESTAMP&gt;&quot;,
      &quot;media_product_type&quot;: &quot;THREADS&quot;,
      &quot;media_type&quot;: &quot;TEXT_POST&quot;,
      &quot;shortcode&quot;: &quot;&lt;SHORT_CODE&gt;&quot;,
      &quot;has_replies&quot;: false,
      &quot;is_reply&quot;: true,
      &quot;hide_status&quot;: &quot;NOT_HUSHED&quot;,
      &quot;reply_approval_status&quot;: &quot;pending&quot;
    &#125;
  ],
  &quot;paging&quot;: &#123;
    &quot;cursors&quot;: &#123;
      &quot;before&quot;: &quot;&lt;BEFORE_CURSOR&gt;&quot;,
      &quot;after&quot;: &quot;&lt;AFTER_CURSOR&gt;&quot;
    &#125;
  &#125;
&#125;
```

### Manage pending replies

Use the `/manage_pending_reply` endpoint to approve/ignore any pending replies.

**Note:** Ignored replies can still be approved.

#### Example request

```html
curl -X POST \
  -F &quot;approve=&#123;true|false&#125;&quot; \
  -F &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/&lt;THREADS_REPLY_ID&gt;/manage_pending_reply&quot;
```

#### Example response

```json
&#123;
 &quot;success&quot;: true
&#125;
```
