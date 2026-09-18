> This page location: Threads API > threads/troubleshooting
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/troubleshooting

# Threads API Troubleshooting



## Publishing Does Not Return a Media ID

If you are able to create a container for a video but the `POST /&#123;threads-user-id&#125;/threads_publish` endpoint does not return the published media ID, then you can get the container&#039;s publishing status by querying the `GET /&#123;threads-container-id&#125;` endpoint. This endpoint will return one of the following:

* `EXPIRED` — The container was not published within 24 hours and has expired.
* `ERROR` — The container failed to complete the publishing process.
* `FINISHED` — The container and its media object are ready to be published.
* `IN_PROGRESS` — The container is still in the publishing process.
* `PUBLISHED` — The container&#039;s media object has been published.

In case of error the endpoint will return one of the following error messages:

* `FAILED_DOWNLOADING_VIDEO`
* `FAILED_PROCESSING_AUDIO`
* `FAILED_PROCESSING_VIDEO`
* `INVALID_ASPEC_RATIO`
* `INVALID_BIT_RATE`
* `INVALID_DURATION`
* `INVALID_FRAME_RATE`
* `INVALID_AUDIO_CHANNELS`
* `INVALID_AUDIO_CHANNEL_LAYOUT`
* `UNKNOWN`

We recommend querying a container&#039;s status once per minute, for no more than 5 minutes.

#### Example Request

```curl
curl -s -X GET \
&quot;https://graph.threads.net/v1.0/&lt;MEDIA_CONTAINER_ID&gt;?fields=status,error_message&amp;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```json
&#123;
  &quot;status&quot;: &quot;FINISHED&quot;,
  &quot;id&quot;: &quot;17889615691921648&quot;
&#125;
```

#### Example Response (in case of error)

```json
&#123;
  &quot;status&quot;: &quot;ERROR&quot;,
  &quot;id&quot;: &quot;17889615691921648&quot;,
  &quot;error_message&quot;: &quot;FAILED_DOWNLOADING_VIDEO&quot;
&#125;
```

## Retrieve Quota Limits

To validate that a user has not exhausted their API quota limits for publishing, reply publishing, deleting, and location search, they can make a call to the
`GET &#123;threads-user-id&#125;/threads_publishing_limit` endpoint. This will return a user&#039;s current Threads API usage total.

#### Example Request

```curl
curl -s -X GET
&quot;https://graph.threads.net/v1.0/&lt;THREADS_USER_ID&gt;/threads_publishing_limit?fields=quota_usage,config,reply_quota_usage,reply_config,delete_quota_usage,delete_config,location_search_quota_usage,location_search_config&amp;access_token=&lt;THREADS_ACCESS_TOKEN&gt;&quot;
```

#### Example Response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;quota_usage&quot;: 0,
      &quot;config&quot;: &#123;
        &quot;quota_total&quot;: 250,
        &quot;quota_duration&quot;: 86400
      &#125;,
      &quot;reply_quota_usage&quot;: 0,
      &quot;reply_config&quot;: &#123;
        &quot;quota_total&quot;: 1000,
        &quot;quota_duration&quot;: 86400
      &#125;,
      &quot;delete_quota_usage&quot;: 0,
      &quot;delete_config&quot;: &#123;
        &quot;quota_total&quot;: 100,
        &quot;quota_duration&quot;: 86400
      &#125;,
      &quot;location_search_quota_usage&quot;: 0,
      &quot;location_search_config&quot;: &#123;
        &quot;quota_total&quot;: 500,
        &quot;quota_duration&quot;: 86400
      &#125;
    &#125;
  ]
&#125;
```
