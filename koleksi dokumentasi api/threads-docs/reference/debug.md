> This page location: Threads API > threads/reference/debug
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/debug

# Debug



Retrieve various data about an access token. See [Debug Access Token](https://developers.facebook.com/documentation/threads/troubleshooting/debug-access-token) for more information.

## `GET /debug_token`

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token of a Threads tester. |
| `input_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The access token to be inspected. |

**Note:** The `access_token` and `input_token` can be associated with different users but must be associated with the same app.

### Fields

| Name | Description |
| --- | --- |
| `data`&lt;br&gt;&lt;br&gt;object | Data wrapper around the result. |
| `type`&lt;br&gt;&lt;br&gt;string | Whether the access token is an app access token or user access token. |
| `application`&lt;br&gt;&lt;br&gt;string | Name of the application this access token is for. |
| `data_access_expires_at`&lt;br&gt;&lt;br&gt;Unixtime | Timestamp when the app&#039;s access to user data expires. |
| `expires_at`&lt;br&gt;&lt;br&gt;Unixtime | Timestamp when this access token expires. |
| `is_valid`&lt;br&gt;&lt;br&gt;Boolean | Whether the access token is still valid or not. |
| `issued_at`&lt;br&gt;&lt;br&gt;Unixtime | Timestamp when this access token was issued. |
| `scopes`&lt;br&gt;&lt;br&gt;string[] | List of permissions that the user has granted for the app in this access token. |
| `user_id`&lt;br&gt;&lt;br&gt;string | The ID of the user this access token is for. |

