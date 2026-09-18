> This page location: Threads API > threads/insights
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/insights

# Threads Insights API



The Threads Insights API allows you to read the insights from users&#039; own Threads.

### Permissions

The Threads Insights API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.
* `threads_manage_insights` — Required for making `GET` calls to insights endpoints.

### Limitations

* The user insights `since` and `until` parameters do not work for dates before April 13, 2024 (Unix timestamp `1712991600`).

## Media Insights

To retrieve the available insights metrics, send a `GET` request to the `/&#123;threads-media-id&#125;/insights` endpoint with the `metric` parameter containing a comma-separated list of metrics to be returned.

**Note:**

* Returned metrics do not capture nested replies&#039; metrics.
* An empty array will be returned for `REPOST_FACADE` posts because they are posts made by other users.

### Available Metrics

| Name | Description |
| --- | --- |
| `views` | The number of times your post was played or displayed.&lt;br&gt;&lt;br&gt;**Note:** This metric is [in development](https://www.facebook.com/business/help/metrics-labeling). |
| `likes` | The number of likes on the post. |
| `replies` | The number of replies on the post.  &lt;br&gt;&lt;br&gt;**Note:** When the requested media is a root post, this number includes total replies. If the media is itself a reply, this number includes only **direct** replies. |
| `reposts` | The number of times the post was reposted. |
| `quotes` | The number of times the post was quoted. |
| `shares` | The number of shares of your Threads posts.&lt;br&gt;&lt;br&gt;**Note:** This metric is [in development](https://www.facebook.com/business/help/metrics-labeling). |

### Example Request

```
curl -s -X GET \
  -F &quot;metric=likes,replies&quot; \
  -F &quot;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot;
&quot;https://graph.threads.net/v1.0/&lt;THREADS_MEDIA_ID&gt;/insights&quot;
```

### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;likes&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 100
        &#125;
      ],
      &quot;title&quot;: &quot;Likes&quot;,
      &quot;description&quot;: &quot;The number of likes on your post.&quot;,
      &quot;id&quot;: &quot;&lt;media_id&gt;/insights/likes/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;replies&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 10
        &#125;
      ],
      &quot;title&quot;: &quot;Replies&quot;,
      &quot;description&quot;: &quot;The number of replies on your post.&quot;,
      &quot;id&quot;: &quot;&lt;media_id&gt;/insights/replies/lifetime&quot;
    &#125;
  ]
&#125;
```

## User Insights

To retrieve the available user insights metrics, send a `GET` request to the `/&#123;threads-user-id&#125;/threads_insights` endpoint with the `metric` parameter, and optionally, the `since` and `until` parameters.  
**Warning:** User insights are not guaranteed to work before June 1, 2024.

### Parameters
| Name | Description |
| --- | --- |
| `since` | **Optional.**  &lt;br&gt;Used in conjunction with the `until` parameter to define a range. If you omit `since` and `until`, it defaults to a 2-day range: yesterday through today.  &lt;br&gt;**Note:** The earliest Unix timestamp that can be used is `1712991600`, any timestamp before that will be rejected.&lt;br&gt;&lt;br&gt;**Format:** Unix Timestamp |
| `until` | **Optional.**  &lt;br&gt;Used in conjunction with the `since` parameter to define a range. If you omit `since` and `until`, it defaults to a 2-day range: yesterday through today.  &lt;br&gt;**Note:** The earliest Unix timestamp that can be used is `1712991600`, any timestamp before that will be rejected.&lt;br&gt;&lt;br&gt;**Format:** Unix Timestamp |
| `metric` | **Required.**  &lt;br&gt;A comma-separated list of the metrics to be returned. Must be at least one of the user metrics values. |

### User Metrics
| Name | Response Type | Description |
| --- | --- | --- |
| `views` | Time Series | The number of times your profile was viewed. |
| `likes` | Total Value | The  number of likes on your posts. |
| `replies` | Total Value | The number of replies on your posts.&lt;br&gt;&lt;br&gt;**Note:** This number includes only top-level replies. |
| `reposts` | Total Value | The number of times your posts were reposted. |
| `quotes` | Total Value | The number of times your posts were quoted. |
| `clicks` | Link Total Values | The number of times people clicked on URLs you shared. |
| `followers_count` | Total Value | Your total number of followers on Threads.&lt;br&gt;&lt;br&gt;**Note:**&lt;br&gt;&lt;br&gt;* This metric does not support the `since` and `until` parameters. |
| `follower_demographics` | Total Value | The demographic characteristics of followers, including countries, cities, and gender distribution.&lt;br&gt;&lt;br&gt;**Note:**&lt;br&gt;&lt;br&gt;* This metric does not support the `since` and `until` parameters.  &lt;br&gt;* A Threads profile must have at least 100 followers to fetch this metric.&lt;br&gt;* Can only have one `breakdown` parameter, which must be equal to one of the following values: `country`, `city`, `age`, or `gender`. |

### Example Request

```
curl -s -X GET \
  -F &quot;metric=views&quot; \
  -F &quot;access_token=&lt;ACCESS_TOKEN&gt;&quot; \
&quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_insights&quot;
```

### Example Time Series Metric Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;views&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 10,
          &quot;end_time&quot;: &quot;2024-07-12T08:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 20,
          &quot;end_time&quot;: &quot;2024-07-15T08:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 30,
          &quot;end_time&quot;: &quot;2024-07-16T08:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;views&quot;,
      &quot;description&quot;: &quot;The number of times your profile was viewed.&quot;,
      &quot;id&quot;: &quot;37602215421583/insights/views/day&quot;
    &#125;
  ]
&#125;
```

### Example Total Value Metric Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;views&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;total_value&quot; : &#123;
        &quot;value&quot;: 1
      &#125;
      &quot;title&quot;: &quot;views&quot;,
      &quot;description&quot;: &quot;The number of times your profile was viewed.&quot;,
      &quot;id&quot;: &quot;37602215421583/insights/views/day&quot;
    &#125;
  ]
&#125;
```

### Example Link Total Value Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;clicks&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;link_total_values&quot;: [
        &#123;
          &quot;value&quot;: 11,
          &quot;link_url&quot;: &quot;https://ai.meta.com/blog/&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;clicks&quot;,
      &quot;description&quot;: &quot;The number of times users clicked on a link.&quot;,
      &quot;id&quot;: &quot;37602215421583/insights/clicks/day&quot;
    &#125;
  ]
&#125;
```
