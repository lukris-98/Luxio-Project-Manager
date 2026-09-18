> This page location: Threads API > threads/reference/insights
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/insights

# Insights



The Threads insights endpoints allow you to retrieve insights for Threads media objects and users. See [Threads Insights API](https://developers.facebook.com/documentation/threads/insights) for more information.

## `GET /&#123;threads-media-id&#125;/insights`

Retrieve insights for a Threads media object. See [Media Insights](https://developers.facebook.com/documentation/threads/insights#media-insights) for more information.

### Parameters

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-media-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads media identifier. |
| `metric`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;A comma-separated list of the metrics to be returned. Must be at least one of the metric values.  &lt;br&gt;**Values:** `views`, `likes`, `replies`, `reposts`, `quotes`, `shares` |

## `GET /&#123;threads-user-id&#125;/threads_insights`
Retrieve insights for a Threads user object. See [User Insights](https://developers.facebook.com/documentation/threads/insights#user-insights) for more information.

### Parameters
| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `threads-user-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads user identifier. |
| `since` | **Optional.**  &lt;br&gt;Used in conjunction with the `until` parameter to define a range. If you omit `since` and `until`, it defaults to a 2-day range: yesterday through today.  &lt;br&gt;**Format:** Unix Timestamp |
| `until` | **Optional.**  &lt;br&gt;Used in conjunction with the `since` parameter to define a range. If you omit `since` and `until`, it defaults to a 2-day range: yesterday through today.  &lt;br&gt;**Format:** Unix Timestamp |
| `metric`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;A comma-separated list of the metrics to be returned. Must be at least one of the metric values.  &lt;br&gt;**Values:** `views`, `likes`, `replies`, `reposts`, `quotes`, `clicks`, `followers_count`, `follower_demographics`  &lt;br&gt;**Note:** `follower_demographics` is not compatible with the `since` and `until` parameters. |

