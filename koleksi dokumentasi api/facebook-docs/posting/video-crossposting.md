> This page location: Facebook Video API > video-api/guides/crossposting
> Source: https://developers.facebook.com/documentation/video-api/guides/crossposting

# Crosspost a Video



This document explains how to use the Video API to publish a video on multiple Pages without uploading the video to each [Page](https://developers.facebook.com/docs/graph-api/reference/page). For example, if you have a parent Page with several child Pages, you can upload and publish a video to the parent Page then publish the [Video](https://developers.facebook.com/docs/graph-api/reference/video) to all child Pages without having to upload the video to each Page.

To crosspost a [Video](https://developers.facebook.com/docs/graph-api/reference/video), you must be able to perform to the [`CREATE` task](https://developers.facebook.com/documentation/pages-api/overview#tasks) on the Pages and [enable the Video to be published to specific Pages](#step-1--enable-crossposting). You will need the ID of the Video and the ID&#039;s of the Pages where you want to publish the Video as well as Page access tokens from the Page where the Video was originally published and the Pages where you want to publish.

You can use the API to determine if a Video is already [eligible for crossposting](#get-video-crossposting-eligibility) or [a crossposted  video](#get-video-crossposting-status), how to [enable crossposting to all Pages managed by your Business Manager](#enable-crossposting-to-all-your-business-manager-pages), and to [get a list of Pages you can crosspost to](#get-video-crossposting-status).

Visit our [**Reels Publishing guide**](https://developers.facebook.com/documentation/video-api/guides/reels-publishing) for informtion about crossposting a reel to a collaborator&#039;s Facebook Page.

### Limitations

If a video has been crossposted to your Page but you do not have a [Role on the Page](https://developers.facebook.com/documentation/pages-api/overview#tasks) where the video was originally published, you cannot change any Permissions of the Video.

### Step 1. Enable Crossposting &#123;#step-1--enable-crossposting&#125;

To publish a Video to multiple Pages you must enable crossposting of the Video to these Pages.

You will need:

* The ID of the Video you want to crosspost
* IDs of Pages where you want to publish the Video
* A Page access token of the Page where the Video was originally published
* The [`publish_video` Permission](https://developers.facebook.com/docs/permission/reference/publish_video)
* The [`pages_manage_posts` Permission](https://developers.facebook.com/docs/permission/reference/pages_manage_posts)
* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permission/reference/pages_read_engagement)

Send a `POST` request to the [Video](https://developers.facebook.com/docs/graph-api/reference/video) endpoint:

```http
POST /&#123;api-version&#125;/&#123;video-id&#125;
  ?allow_crossposting_for_pages=[&#123;page_id:&#123;page-a-id&#125;,allow:true&#125;,&#123;page_id:&#123;page-b-id&#125;,allow:true&#125;]
  &amp;access_token=&#123;page-access-token&#125;
```

Include the following parameters:

| Parameter Name | Value |
| --- | --- |
| `allow_crossposting_for_pages` | A JSON array of Page IDs where you want to publish the video. Set `allow` to `true` to enable publishing or `false` to disable publishing. |
| `access_token` | The Page access token of the Page where the video was originally published. |

#### Sample Request

```curl
curl -X POST \
  &quot;https://graph.facebook.com/v7.0/2918040388250909&quot; \
  -F &quot;allow_crossposting_for_pages=[&#123;page_id:104371193424796,allow:true&#125;,&#123;page_id:115969103185286&quot;,allow:true&#125;] \
  -F &quot;access_token=EAABkW...&quot;
```

#### Sample Response

```json
&#123;
  &quot;success&quot;: true
&#125;
```

### Step 2. Crosspost the Video

You will need:

* The ID of the Video you want to crosspost
* The ID of the Page where you want to publish the Video
* A Page access token of the Page where you want the Video published
* The [`publish_video` Permission](https://developers.facebook.com/docs/permission/reference/publish_video)
* The [`pages_manage_posts` Permission](https://developers.facebook.com/docs/permission/reference/pages_manage_posts)
* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permission/reference/pages_read_engagement)

Send a `POST` request to the [Page Videos](https://developers.facebook.com/docs/graph-api/reference/page/videos) endpoint:

```http
POST /&#123;api-version&#125;/&#123;page-id&#125;/videos
    ?crossposted_video_id=&#123;video-id&#125;
    &amp;access_token=&#123;page-access-token&#125;
```

Include the following parameters:

| Parameter Name | Value |
| --- | --- |
| `crossposted_video_id` | The video ID of the Video you are crossposting. |
| `access_token` | The Page access token of the Page where you are publishing the video. |

#### Sample Request

```curl
curl -X POST \
  &quot;https://graph.facebook.com/104371193424796/videos?crossposted_video_id=2918040388250909&amp;access_token=EAABk...&quot;
```

#### Sample JSON Response

```
&#123;
  &quot;id&quot;:&quot;577600939847873&quot;
&#125;
```

## Get Video Crossposting Eligibility

To determine if a Video is eligible to be crossposted, send a `GET` request to the Video endpoint with the `is_crossposting_eligible` field.

You will need:

* The ID of the Video you want to crosspost
* A Page access token of the Page where the Video was originally published
* The [`pages_manage_posts` Permission](https://developers.facebook.com/docs/permission/reference/pages_manage_posts)
* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permission/reference/pages_read_engagement)

```http
GET /&#123;api-version&#125;/&#123;video-id&#125;
   ?fields=is_crossposting_eligible
   &amp;access_token=&#123;page-access-token&#125;
```

#### Sample Request

```curl
curl -X GET \
  &quot;https://graph.facebook.com/v7.0/2918040388250909&quot; \
  -F &quot;is_crossposting_eligible&quot; \
  -F &quot;access_token=EAABkW...&quot;
```

#### Sample Response

```json
&#123;
  &quot;is_crossposting_eligible&quot;: true,
  &quot;id&quot;: &quot;2918040388250909&quot;
&#125;
```

| Parameter Name | Value |
| --- | --- |
| `is_crossposting_eligible` | Displays if the Video is enabled to be crossposted. |
| `access_token` | The Page access token of the Page where the Video was originally published. |

## Get Video Crossposting Status

To determine if the Video is a crossposted Video, send a `GET` request to the Video endpoint with the `is_crosspost_video` field.

You will need:

* The ID of the Video you want to check
* A Page access token of the Page where the video was originally published
* The [`publish_video` Permission](https://developers.facebook.com/docs/permission/reference/publish_video)
* The [`pages_manage_posts` Permission](https://developers.facebook.com/docs/permission/reference/pages_manage_posts)
* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permission/reference/pages_read_engagement)

```http
GET /&#123;api-version&#125;/&#123;video-id&#125;
  ?fields=is_crosspost_video
  &amp;access_token=&#123;page-access-token&#125;
```

Include the following parameters

| Parameter Name | Value |
| --- | --- |
| `is_crosspost_video` | Displays if the Video is the original or is a crossposted Video. |
| `access_token` | The Page access token of the Page where the Video was originally published. |

#### Sample Request

```curl
curl -X GET \
 &quot;https://graph.facebook.com/v7.0/577600939847873?fields=is_crosspost_video&amp;access_token=EAABk...&quot;
```

#### Sample Response

```json
&#123;
  &quot;is_crosspost_video&quot;: true,
  &quot;id&quot;: &quot;577600939847873&quot;
&#125;
```

## Get a List of Pages Eligible for Crossposting

You will need:

* The ID of the Page where the Video was originally published
* A Page access token of the Page where the Video was originally published
* The [`pages_manage_posts` Permission](https://developers.facebook.com/docs/permission/reference/pages_manage_posts)
* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permission/reference/pages_read_engagement)

Send a `GET` request to the [Page CrosspostWhitelistedPages endpoint](https://developers.facebook.com/docs/graph-api/reference/page/crosspost_whitelisted_pages).

```http
GET &#123;page-id&#125;/crosspost_whitelisted_pages
  &amp;access_token=&#123;page-access-token&#125;
```

#### Sample Request

```
curl -X GET \ &quot;https://graph.facebook.com/v7.0/2918040388250909/crosspost_whitelisted_pages&amp;access_token=EAABk...&quot;
```

#### Sample Response

```
&#123;
  &quot;crosspost_whitelisted_pages&quot;: &#123;
    &quot;data&quot;: [
      &#123;
        &quot;name&quot;: &quot;Obsession, by Margaret&quot;,
        &quot;id&quot;: &quot;115969103185286&quot;
      &#125;,
      &#123;
        &quot;name&quot;: &quot;Cisco Dog&quot;,
        &quot;id&quot;: &quot;422575694827569&quot;
      &#125;
    ],
    &quot;paging&quot;: &#123;
      &quot;cursors&quot;: &#123;
        &quot;before&quot;: &quot;QVFIUn...&quot;,
        &quot;after&quot;: &quot;QVFIUk4...&quot;
      &#125;
    &#125;
  &#125;,
  &quot;id&quot;: &quot;1353269864728879&quot;
&#125;
```

## Enable Crossposting to All Your Business Manager Pages

To enable crossposting to all Pages managed by your Business Manager, send a `POST` request to the [Video](https://developers.facebook.com/docs/graph-api/reference/video) endpoint.

You will need:

* The ID of the Video you want to crosspost
* A Page access token of the Page where the Video was originally published
* The [`pages_manage_posts` Permission](https://developers.facebook.com/docs/permission/reference/pages_manage_posts)
* The [`pages_read_engagement` Permission](https://developers.facebook.com/docs/permission/reference/pages_read_engagement)

```http
POST /&#123;api-version&#125;/&#123;video-id&#125;
  ?allow_bm_crossposting=true
  &amp;access_token=&#123;page-access-token&#125;
```

Include the following parameters

| Parameter Name | Value |
| --- | --- |
| `allow_bm_crossposting` | Set `allow` to true to enable publishing or false to disable publishing. |
| `access_token` | The Page access token of the Page where the video was originally published. |

#### Sample Request

```curl
curl -X POST \
  &quot;https://graph.facebook.com/v7.0/2918040388250909?allow_bm_crossposting=true&amp;access_token=EAABkW...&quot;
```

#### Sample Response

```json
&#123;
  &quot;success&quot;: true
&#125;
```

## Insights

Each crossposted Video has its own unique `video_id`. You can see [video insights](https://developers.facebook.com/documentation/video-api/guides/insights) from each Video and Page.

## See Also

For more information about crossposting, visit our [Help Center](https://www.facebook.com/help/publisher/1385580858214929).

