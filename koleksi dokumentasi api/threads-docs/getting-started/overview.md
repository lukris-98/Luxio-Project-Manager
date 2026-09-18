> This page location: Threads API > threads/overview
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/overview

# Overview



You may use the Threads API to enable people to create and publish content on a person’s behalf on Threads, and to display those posts within your app solely to the person who created it.

**Warning:** The Threads API can be accessed by either `graph.threads.com` or `graph.threads.net`.

## Rate Limiting

Calls to the Threads API are counted against the calling app&#039;s call count. An app&#039;s call count is unique for each app and app user pair and is the number of calls the app has made in a rolling 24-hour window. It is calculated as follows:

`Calls within 24 hours = 4800 * Number of Impressions`

The Number of Impressions is the number of times any content from the app user&#039;s Threads account has entered a person&#039;s screen within the last 24 hours.

Rate limiting may also be subject to total CPU time per day:

`720000 * number_of_impressions for total_cputime 

2880000 * Number of Impressions for total_time`

**Note:** The minimum value for impressions is 10 (so if the impressions is less than 10 we default to 10).


### Posts

Threads profiles are limited to 250 API-published posts within a 24-hour moving period. Carousels count as a single post. This limit is enforced on the `POST /&#123;threads-user-id&#125;/threads_publish` endpoint when attempting to publish a media container. We recommend that your app also enforces the publishing rate limit, especially if your app allows app users to schedule posts to be published in the future.

To check a profile&#039;s current Threads API rate limit usage, query the [`GET /&#123;threads-user-id&#125;/threads_publishing_limit` endpoint](https://developers.facebook.com/documentation/threads/reference/user#get---threads-user-id--threads-publishing-limit).

**Note:** This endpoint requires the `threads_basic` and `threads_content_publish` permissions.

#### Fields

| Name | Description |
| --- | --- |
| `quota_usage` | Threads publishing count over the last 24 hours. |
| `config` | Threads publishing rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```
curl -s -X GET \
  &quot;https:graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_publishing_limit?fields=quota_usage,config&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;quota_usage&quot;: 4,
      &quot;config&quot;: &#123;
        &quot;quota_total&quot;: 250,
        &quot;quota_duration&quot;: 86400
      &#125;
    &#125;
  ]
&#125;
```

### Replies

Threads profiles are limited to 1,000 replies within a 24-hour moving period.

To check a profile&#039;s current Threads replies rate limit usage, query the [`GET /&#123;threads-user-id&#125;/threads_publishing_limit` endpoint](https://developers.facebook.com/documentation/threads/reference/user#get---threads-user-id--threads-publishing-limit). See the [Reply Management](https://developers.facebook.com/documentation/threads/reply-management) documentation for more information.

**Note:** This endpoint requires the `threads_basic`, `threads_content_publish`, and `threads_manage_replies` permissions.

#### Fields

| Name | Description |
| --- | --- |
| `reply_quota_usage` | Threads reply publishing count over the last 24 hours. |
| `reply_config` | Threads reply publishing rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```
curl -s -X GET \
  &quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_publishing_limit?fields=reply_quota_usage,reply_config&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;reply_quota_usage&quot;: 1,
      &quot;reply_config&quot;: &#123;
        &quot;quota_total&quot;: 1000,
        &quot;quota_duration&quot;: 86400
      &#125;
    &#125;
  ]
&#125;
```

### Deletion

Threads profiles are limited to 100 deletions within a 24-hour moving period.

To check a profile&#039;s current Threads deletion rate limit usage, query the [`GET /&#123;threads-user-id&#125;/threads_publishing_limit` endpoint](https://developers.facebook.com/documentation/threads/reference/user#get---threads-user-id--threads-publishing-limit). See the [Delete Posts](https://developers.facebook.com/documentation/threads/posts/delete-posts) documentation for more information.

**Note:** This endpoint requires the `threads_basic` and `threads_delete` permissions.

#### Fields

| Name | Description |
| --- | --- |
| `delete_quota_usage` | Threads deletion count over the last 24 hours. |
| `delete_config` | Threads deletion rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```
curl -s -X GET \
  &quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_publishing_limit?fields=delete_quota_usage,delete_config&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;delete_quota_usage&quot;: 1,
      &quot;delete_config&quot;: &#123;
        &quot;quota_total&quot;: 100,
        &quot;quota_duration&quot;: 86400
      &#125;
    &#125;
  ]
&#125;
```

### Location Search

Threads profiles are limited to 500 location searches within a 24-hour moving period.

To check a profile&#039;s current Threads location search rate limit usage, query the [`GET /&#123;threads-user-id&#125;/threads_publishing_limit` endpoint](https://developers.facebook.com/documentation/threads/reference/user#get---threads-user-id--threads-publishing-limit). See the [Location Search](https://developers.facebook.com/documentation/threads/create-posts/location-tagging#search) documentation for more information.

**Note:** This endpoint requires the `threads_basic` and `threads_location_tagging` permissions.

#### Fields

| Name | Description |
| --- | --- |
| `location_search_quota_usage` | Threads location search count over the last 24 hours. |
| `location_search_config` | Threads location search rate limit config object, which contains the `quota_total` and `quota_duration` fields. |

#### Example Request

```
curl -s -X GET \
  &quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_publishing_limit?fields=location_search_quota_usage,location_search_config&amp;access_token=&lt;ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;location_search_quota_usage&quot;: 1,
      &quot;location_search_config&quot;: &#123;
        &quot;quota_total&quot;: 500,
        &quot;quota_duration&quot;: 86400
      &#125;
    &#125;
  ]
&#125;
```

## Limitations and Specifications

### Image Specifications

* **Format:** JPEG and PNG image types are the officially supported formats for image posts.
* **File Size:** 8 MB maximum.
* **Aspect Ratio Limit:** 10:1
* **Minimum Width:** 320 (will be scaled up to the minimum if necessary)
* **Maximum Width:** 1440 (will be scaled down to the maximum if necessary)
* **Height:** Varies (depending on width and aspect ratio)
* **Color Space:** sRGB. Images using other color spaces will have their color spaces converted to sRGB.

### Video Specifications

* **Container:** MOV or MP4 (MPEG-4 Part 14), no edit lists, moov atom at the front of the file.
* **Audio Codec:** AAC, 48khz sample rate maximum, 1 or 2 channels (mono or stereo).
* **Video Codec:** HEVC or H264, progressive scan, closed GOP, 4:2:0 chroma subsampling.
* **Frame Rate:** 23-60 FPS
* **Picture Size:**
    * Maximum Columns (horizontal pixels): 1920
    * Required aspect ratio is between 0.01:1 and 10:1 but we recommend 9:16 to avoid cropping or blank space.
* **Video Bitrate:** VBR, 100 Mbps maximum.
* **Audio Bitrate:** 128 kbps.
* **Duration:** 300 seconds (5 minutes) maximum, minimum longer than 0 seconds.
* **File Size:** 1 GB maximum.


### Other Limitations

* Text posts are limited to 500 characters.
* Carousel posts must have a maximum of 20 children and a minimum of 2 children.
* For additional limitations, refer to each endpoint&#039;s reference.

## Next Steps

* [Get Started with the Threads API](https://developers.facebook.com/documentation/threads/get-started)
