> This page location: Facebook Pages API > pages-api/platforminsights/page
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/platforminsights/page

# Get Page Insights



This guide explains how to get [metrics](https://developers.facebook.com/docs/graph-api/reference/insights) for your Facebook Pages. Get the total number of people who liked your Page or the number of people who shared stories about your Page.

**Warning:** By June 15, 2026, a [number of the Page Insights metrics](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics) will be deprecated for all API versions. The API returns an invalid metric error when calling any of these metrics. [Read our blog to learn more.](  https://developers.facebook.com/blog/post/2026/02/18/introducing-graph-api-v25-and-marketing-api-v25/)

#### Limitations

* Metric data of public Pages is stored by Facebook for 2 years.
* Metric data of unpublished Pages is stored for only 5 days.
* When viewing daily metrics with `since` and `until`, the first `end_time` value will be the date specified by `since` plus 1 so that it includes the `since` date data. For example, if you set `since` to January 1, 2018, the `end_time` will be January 2, 2018 at 8:00 GMT.

## Before You Start

* [`pages_read_engagement` permission](https://developers.facebook.com/docs/apps/review/login-permissions#manage-pages)
* [`read_insights` permission](https://developers.facebook.com/docs/apps/review/login-permissions#read-insights)
* A [Page Access Token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) - The person requesting the token must be able to perform the [analyze](https://developers.facebook.com/documentation/pages-api/overview#tasks) task on the Page.

## Get a Single Metric

Send a `GET` request to the `/&#123;page-id&#125;/insights/&#123;metric-name&#125;` endpoint:

```
curl -i -X GET &quot;https://graph.facebook.com/&#123;page-id&#125;/insights/page_impressions_unique
  ?access_token=&#123;page-access-token&#125;&quot;
```

On success your app receives the following response:

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;page_impressions_unique&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 66226,
          &quot;end_time&quot;: &quot;2020-03-10T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 78037,
          &quot;end_time&quot;: &quot;2020-03-11T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Daily Total Reach&quot;,
      &quot;description&quot;: &quot;Daily: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)&quot;,
      &quot;id&quot;: &quot;&#123;page-id&#125;/insights/page_impressions_unique/day&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_unique&quot;,
      &quot;period&quot;: &quot;week&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 202229,
          &quot;end_time&quot;: &quot;2020-03-10T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 206982,
          &quot;end_time&quot;: &quot;2020-03-11T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Weekly Total Reach&quot;,
      &quot;description&quot;: &quot;Weekly: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)&quot;,
      &quot;id&quot;: &quot;&#123;page-id&#125;/insights/page_impressions_unique/week&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_unique&quot;,
      &quot;period&quot;: &quot;days_28&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 427380,
          &quot;end_time&quot;: &quot;2020-03-10T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 432909,
          &quot;end_time&quot;: &quot;2020-03-11T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;28 Days Total Reach&quot;,
      &quot;description&quot;: &quot;28 Days: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)&quot;,
      &quot;id&quot;: &quot;&#123;page-id&#125;/insights/page_impressions_unique/days_28&quot;
    &#125;
  ],
  &quot;paging&quot;: &#123;
    &quot;previous&quot;: &quot;https://graph.facebook.com/&#123;page-id&#125;/insights?access_token=&#123;page-access-token&#125;&amp;pretty=0&amp;metric=page_impressions_unique&amp;since=1583568000&amp;until=1583737200&quot;,
    &quot;next&quot;: &quot;https://graph.facebook.com/&#123;page-id&#125;/insights?access_token=&#123;page-access-token&#125;&amp;pretty=0&amp;metric=page_impressions_unique&amp;since=1583910000&amp;until=1584082800&quot;
  &#125;
&#125;
```

## Get Multiple Metrics

Send a `GET` request to the `/&#123;page-id&#125;/insights` endpoint with the `metric` field:

```
curl -i -X GET &quot;https://graph.facebook.com/&#123;page-id&#125;/insights
  ?metric=page_impressions_unique,page_impressions_paid
  &amp;access_token=&#123;page-access-token&#125;&quot;
```

On success, your app receives the following response:

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;page_impressions_unique&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 60,
          &quot;end_time&quot;: &quot;2024-03-11T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 50,
          &quot;end_time&quot;: &quot;2024-03-12T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Daily Total Reach&quot;,
      &quot;description&quot;: &quot;Daily: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)&quot;,
      &quot;id&quot;: &quot;PAGE_ID/insights/page_impressions_unique/day&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_paid&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 8,
          &quot;end_time&quot;: &quot;2024-03-11T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 10,
          &quot;end_time&quot;: &quot;2024-03-12T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Daily Paid Impressions&quot;,
      &quot;description&quot;: &quot;Daily: The number of times any post or story content from your Page or about your Page entered a person&#039;s screen through paid distribution such as an ad. (Total Count)&quot;,
      &quot;id&quot;: &quot;PAGE_ID/insights/page_impressions_paid/day&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_unique&quot;,
      &quot;period&quot;: &quot;week&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 40,
          &quot;end_time&quot;: &quot;2024-03-11T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 50,
          &quot;end_time&quot;: &quot;2024-03-12T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Weekly Total Reach&quot;,
      &quot;description&quot;: &quot;Weekly: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)&quot;,
      &quot;id&quot;: &quot;PAGE_ID/insights/page_impressions_unique/week&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_paid&quot;,
      &quot;period&quot;: &quot;week&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 50,
          &quot;end_time&quot;: &quot;2024-03-11T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 106,
          &quot;end_time&quot;: &quot;2024-03-12T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Weekly Paid Impressions&quot;,
      &quot;description&quot;: &quot;Weekly: The number of times any post or story content from your Page or about your Page entered a person&#039;s screen through paid distribution such as an ad. (Total Count)&quot;,
      &quot;id&quot;: &quot;PAGE_ID/insights/page_impressions_paid/week&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_unique&quot;,
      &quot;period&quot;: &quot;days_28&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 110,
          &quot;end_time&quot;: &quot;2024-03-11T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 10,
          &quot;end_time&quot;: &quot;2024-03-12T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;28 Days Total Reach&quot;,
      &quot;description&quot;: &quot;28 Days: The number of people who had any content from your Page or about your Page enter their screen. This includes posts, check-ins, ads, social information from people who interact with your Page and more. (Unique Users)&quot;,
      &quot;id&quot;: &quot;PAGE_ID/insights/page_impressions_unique/days_28&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;page_impressions_paid&quot;,
      &quot;period&quot;: &quot;days_28&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 120,
          &quot;end_time&quot;: &quot;2024-03-11T07:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 20,
          &quot;end_time&quot;: &quot;2024-03-12T07:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;28 Days Paid Impressions&quot;,
      &quot;description&quot;: &quot;28 days: The number of times any post or story content from your Page or about your Page entered a person&#039;s screen through paid distribution such as an ad. (Total Count)&quot;,
      &quot;id&quot;: &quot;PAGE_ID/insights/page_impressions_paid/days_28&quot;
    &#125;
  ],
...
```

## Get Metrics of a Page Post

Send a `GET` request to the `/&#123;page-post-id&#125;/insights` endpoint with the `metric` fields:

```
curl -i -X GET &quot;https://graph.facebook.com&#123;page-post-id&#125;/insights
  ?metric=post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total
  &amp;access_token=&#123;page-access-token&#125;&quot;
```

On success, your app receives the following response:

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;post_reactions_like_total&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 226
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Total Like Reactions of a post.&quot;,
      &quot;description&quot;: &quot;Lifetime: Total like reactions of a post.&quot;,
      &quot;id&quot;: &quot;&#123;page-post-id&#125;/insights/post_reactions_like_total/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;post_reactions_love_total&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 17
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Total Love Reactions of a post.&quot;,
      &quot;description&quot;: &quot;Lifetime: Total love reactions of a post.&quot;,
      &quot;id&quot;: &quot;&#123;page-post-id&#125;/insights/post_reactions_love_total/lifetime&quot;
    &#125;,
    &#123;
      &quot;name&quot;: &quot;post_reactions_wow_total&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 1
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Total wow Reactions of a post.&quot;,
      &quot;description&quot;: &quot;Lifetime: Total wow Reactions of a post.&quot;,
      &quot;id&quot;: &quot;&#123;page-post-id&#125;/insights/post_reactions_wow_total/lifetime&quot;
    &#125;
  ],
  &quot;paging&quot;: &#123;
    &quot;previous&quot;: &quot;https://graph.facebook.com/&#123;page-post-id&#125;/insights?access_token=&#123;page-access-token&#125;b&amp;pretty=0&amp;metric=post_reactions_like_total%2Cpost_reactions_love_total%2Cpost_reactions_wow_total&amp;since=1583568000&amp;until=1583737200&quot;,
    &quot;next&quot;: &quot;https://graph.facebook.com/&#123;page-post-id&#125;/insights?access_token=&#123;page-access-token&#125;&amp;pretty=0&amp;metric=post_reactions_like_total%2Cpost_reactions_love_total%2Cpost_reactions_wow_total&amp;since=1583910000&amp;until=1584082800&quot;
  &#125;
&#125;
```

## Get Video Ad Breaks Impressions

#### Additional Requirements

* The person requesting the Page access token must be able to [access the monetization insights](https://developers.facebook.com/business/help/442345745885606?id=180505742745347).

Send a `GET` request to the `/&#123;page-id&#125;` endpoint to get daily Video Ad Breaks impressions for a Page:

```
curl -i -X GET \
  &quot;https://graph.facebook.com/&#123;page-id&#125;/insights
    ?metric=page_daily_video_ad_break_ad_impressions_by_crosspost_status
    &amp;period=day
    &amp;since=2017-12-10
    &amp;until=2017-12-14&quot;
```

On success, your app receives the following response:

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;page_daily_video_ad_breaks_ad_impressions_by_crosspost_status&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: &#123;
          &quot;crossposted&quot;: 27584,
          &quot;owned&quot;: 692730
          &#125;,
          &quot;end_time&quot;: &quot;2017-12-11T08:00:00+0000&quot;
          &#125;,
          &#123;
            &quot;value&quot;: &#123;
              &quot;owned&quot;: 757456,
              &quot;crossposted&quot;: 20593
            &#125;,
            &quot;end_time&quot;: &quot;2017-12-12T08:00:00+0000&quot;
          &#125;,
          &#123;
            &quot;value&quot;: &#123;
              &quot;owned&quot;: 690092,
              &quot;crossposted&quot;: 15372
            &#125;,
            &quot;end_time&quot;: &quot;2017-12-13T08:00:00+0000&quot;
          &#125;
        ],
        &quot;title&quot;: &quot;Daily page level videos ad impression&quot;,
        &quot;description&quot;: &quot;Number of times an ad was shown during ad breaks in your Page&#039;s videos, by distribution type (page_owned and crossposted).&quot;,
        &quot;id&quot;: &quot;&#123;page-id&#125;/insights/page_daily_video_ad_break_ad_impressions_by_crosspost_status/day&quot;
      &#125;
...
```

## Get Daily Video Ad Break Impressions of a Page Post

Send a `GET` request to the `/&#123;page-post-id&#125;/insights` endpoint with the `metric` field:

```
curl -i -X GET &quot;https://graph.facebook.com/&#123;page-post-id&#125;/insights
  ?metric=post_video_ad_break_ad_impressions
  &amp;period=day
  &amp;since=2017-12-10
  &amp;until=2017-12-14
  &amp;access_token=&#123;page-access-token&#125;&quot;
```

On success, your app will receive the following response:

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;total_video_ad_break_ad_impressions&quot;,
      &quot;period&quot;: &quot;day&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 2612,
          &quot;end_time&quot;: &quot;2017-12-11T08:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 1038,
          &quot;end_time&quot;: &quot;2017-12-12T08:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 818,
          &quot;end_time&quot;: &quot;2017-12-13T08:00:00+0000&quot;
        &#125;,
        &#123;
          &quot;value&quot;: 553,
          &quot;end_time&quot;: &quot;2017-12-14T08:00:00+0000&quot;
        &#125;
      ],
      &quot;title&quot;: &quot;Daily Video Ad Break Ad Impressions&quot;,
      &quot;description&quot;: &quot;Number of times an ad was shown during your video ad breaks.&quot;,
      &quot;id&quot;: &quot;&#123;video-id&#125;/video_insights/total_video_ad_break_ad_impressions/day&quot;
    &#125;
...
```

## Get Lifetime Video Ad Break Impressions of a Page Post

```
curl -i -X GET &quot;https://graph.facebook.com/&#123;page-post-id&#125;/insights
  ?metric=post_video_ad_break_ad_impressions
  &amp;period=lifetime
  &amp;access_token=&#123;page-access-token&#125;&quot;
```

On success, your app will receive the following response:

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;total_video_ad_break_ad_impressions&quot;,
      &quot;period&quot;: &quot;lifetime&quot;,
      &quot;values&quot;: [
        &#123;
          &quot;value&quot;: 55468
        &#125;
      ],
      &quot;title&quot;: &quot;Lifetime Video Ad Break Ad Impressions&quot;,
      &quot;description&quot;: &quot;Number of times an ad was shown during your video ad breaks.&quot;,
      &quot;id&quot;: &quot;&#123;video-id&#125;/video_insights/total_video_ad_break_ad_impressions/lifetime&quot;
    &#125;
...
```

## Common Error Codes

| Error Code | Error Message | Description |
| --- | --- | --- |
| None | An empty dataset is returned. | You need the `read_insights` permission in order to access this endpoint. |
| `100` | &quot;(#100) The value must be a valid insights metric&quot; | The may be a spelling or syntax issue. |
| `3001` with `&quot;error_subcode&quot;: 1504028` | &quot;No metric was specified to be fetched. Please specify one or more metrics to be fetched and try again.&quot; | When using the `metric` parameter, at least one metric must be included in the query. |

## See Also

* [Insights Dashboard](https://www.facebook.com/insights)
* [Insights Reference Guide](https://developers.facebook.com/docs/graph-api/reference/insights)  
* [Page Video Ad Breaks Metrics Reference Guide](https://developers.facebook.com/docs/graph-api/reference/insights#video-ad-breaks)
* [Video Insights Reference Guide](https://developers.facebook.com/docs/graph-api/reference/video/video_insights)
