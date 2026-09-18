> This page location: Facebook Video API > video-api/guides/insights
> Source: https://developers.facebook.com/documentation/video-api/guides/insights

# Get Insights using the Facebook Video API from Meta



This guide shows you how to get insights for a video that has been published on a Facebook Page.

[Learn more about Reels Insights](https://developers.facebook.com/docs/graph-api/reference/video/video_insights#reels-metrics)

## Before You Start

You will need:

* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permissions/reference/pages_read_engagement)
* A Page access token requested from a person who can perform the [`ANALYZE` task](https://developers.facebook.com/documentation/pages-api/overview#tasks) on the Page

### Limitations

* Insights for Videos published on Facebook groups or users are not available.
* A crossposted Video will have its own unique `&lt;VIDEO_ID&gt;` for each Page it was posted to.

## Get Total Insights

Send a `GET` request to the `/&lt;VIDEO_ID&gt;/video_insights` endpoint to get total insights from all video posts associated with this video.

```http
GET &lt;API_VERSION&gt;/&lt;VIDEO_ID&gt;/video_insights?access_token=&lt;PAGE_ACCESS_TOKEN&gt;&quot;
```

#### EXample Request

```curl
curl -X GET \
 &quot;https://graph.facebook.com/v20.0/323790578640877/video_insights?access_token=EAABkW...&quot;
```

#### Sample Response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;total_video_views&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 89
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Total Video Views&quot;,
      &quot;description&quot;: &quot;Lifetime: Total number of times your video was viewed for 3 seconds or viewed to the end, whichever came first. (Total Count)&quot;,
      &quot;id&quot;: &quot;323790578640877/video_insights/total_video_views/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;total_video_views_unique&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 56
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Unique Video Views&quot;,
      &quot;description&quot;: &quot;Lifetime: Number of unique people who viewed your video for 3 seconds or viewed to the end, whichever came first. (Unique Users)&quot;,
      &quot;id&quot;: &quot;323790578640877/video_insights/total_video_views_unique/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;total_video_views_autoplayed&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 23
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Auto-Played Video Views&quot;,
      &quot;description&quot;: &quot;Lifetime: Number of times your video started automatically playing and people viewed it for 3 seconds or viewed it to the end, whichever came first. (Total Count)&quot;,
      &quot;id&quot;: &quot;323790578640877/video_insights/total_video_views_autoplayed/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;total_video_views_clicked_to_play&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 12
        &#125;
      ],
    &#125;
    ...
  ]
&#125;
```

## Get Specific Insight Metrics

Send a `GET` request to the [VideoVideoInsights](https://developers.facebook.com/docs/graph-api/reference/video/video_insights) endpoint with the `metric` parameter and [specific metrics](https://developers.facebook.com/docs/graph-api/reference/video/video_insights#metrics) you wish to receive.

```http
GET /&lt;API_VERSION&gt;/&lt;VIDEO_ID&gt;/video_insights
  ?metric=total_video_views,total_video_views_unique
  &amp;access_token=&lt;PAGE_ACCESS_TOKEN&gt;&quot;
```

#### Sample Request

```curl
curl -X GET \
  &quot;https://graph.facebook.com/v20.0/323790578640877/video_insights?metric=total_video_views,total_video_views_unique&amp;access_token=EAABkW...&quot;
```

#### Sample Response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;total_video_views&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 2206
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Total Video Views&quot;,
      &quot;description&quot;: &quot;Lifetime: Total number of times your video was viewed for 3 seconds or viewed to the end, whichever came first. (Total Count)&quot;,
      &quot;id&quot;: &quot;323790578640877/video_insights/total_video_views/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;total_video_views_unique&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 6
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Unique Video Views&quot;,
      &quot;description&quot;: &quot;Lifetime: Number of unique people who viewed your video for 3 seconds or viewed to the end, whichever came first. (Unique Users)&quot;,
      &quot;id&quot;: &quot;323790578640877/video_insights/total_video_views_unique/lifetime&quot;
    &#125;
  ]
&#125;
```

## Learn More

* [Video Insights Reference guide](https://developers.facebook.com/docs/graph-api/reference/video/video_insights)
* Get Video insights using the [Pages API](https://developers.facebook.com/docs/pages/insights)
* [Page Platform Insights guide](https://developers.facebook.com/documentation/pages-api/platforminsights/page)
* [Pages Video Reference guide](https://developers.facebook.com/docs/graph-api/reference/page/videos)
* [Pages Insights Reference guide](https://developers.facebook.com/docs/graph-api/reference/page/insights#videoviews)
* [Insights Reference guide](https://developers.facebook.com/docs/graph-api/reference/v7.0/insights)
