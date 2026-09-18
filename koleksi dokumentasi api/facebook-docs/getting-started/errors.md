> This page location: Facebook Pages API > pages-api/error-codes
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/error-codes

# Facebook Pages API  Error Codes



This guide displays common error codes, error messages, and descriptions related to the Facebook Pages API .

| Error Codes | Error Message | Description |
| --- | --- | --- |
| `1713216` | You can&#039;t create a video engagement Custom Audience with video &#123;object_id&#125; because this video isn&#039;t associated with a Facebook Page. | This video must be associated with a Facebook Page to create a [video engagement Custom Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience). |
| `200` with subcode `2069030` | This endpoint is not supported. | The endpoint in your call is not supported. |
| `200` with subcode `2069031` | This field is not supported. | The field of the endpoint in your call is not supported. |
| `190` with subcode `2069032` | A Page access token is required for this call. | This endpoint must be called with a [Page access token](https://developers.facebook.com/documentation/pages-api#access-tokens--features--permissions--and-tasks). |
| `200` with subcode `2069033` | The corresponding UI feature of this API is deprecated or not available. | The corresponding UI feature of this API is deprecated or not available. Please review the [Graph API Reference](https://developers.facebook.com/docs/graph-api/reference) or the [Overview](https://developers.facebook.com/documentation/pages-api) for more information about this endpoint and its fields. |
| `2446158` | This ad objective is not supported. You can create it with a Page instead. | This [ad objective](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview#objectives) is not supported. |
| `1` with subcode `2853006` | Viewer doesn&#039;t have permission to perform this action. | You do not have permission to [perform this task](https://developers.facebook.com/documentation/pages-api/overview#tasks). Contact an admin of the Page to request access. |
| `2874008` | Facebook Page insights are only available for Pages with at least 100 Page followers. | [Page insights](https://developers.facebook.com/docs/graph-api/reference/page/insights) are only available for Pages that have at least 100 followers. |
| `2932001` | To access this info, the post needs to be set to public. | [Page insights](https://developers.facebook.com/documentation/pages-api/platforminsights/page) are only available for public posts. |
| `2932003` | You can only get insights on the original post of a shared post but only if you own the original post. You can only boost the original post of a shared post but only if you own the original post. | You can only get insights on the original post, as long as you are the owner, of a [shared post](https://developers.facebook.com/docs/graph-api/reference/page-post/sharedposts). |
| `2932004` | To access this info, you need to be the creator of the post. | To get insights or boost a [shared Page post](https://developers.facebook.com/docs/graph-api/reference/page-post/sharedposts), you must be the owner of the original post and must use the original post to get insights or boost the post. |
| `2932005` | &#123;Name&#125; tagged you in this post. To access this info, you need to be the creator of the post. | To get insights or boost a post in which your [Page was mentioned](https://developers.facebook.com/documentation/pages-api/comments-mentions), you must own the post. |
| `2932006` | This info isn&#039;t available for profile pictures. To get insights or boost a post, you can add this photo to a new post. | Insights or boosting a [profile picture](https://developers.facebook.com/docs/graph-api/reference/page/picture) change is not supported. Create a post with the new profile picture to boost and get insights. |
| `2932007` | This info isn&#039;t available for cover photos. To get insights or boost a post, you can add this photo to a new post. | Insights or boosting a [cover photo](https://developers.facebook.com/docs/graph-api/reference/cover-photo) change is not supported. Create a post with the new cover photo to boost and get insights. |
| `2932009` | This info isn&#039;t available for live videos. | Insights or boosting a [live video](https://developers.facebook.com/documentation/live-video-api/guides/streaming) is not supported. |
| `2932010` | This info isn&#039;t available right now. | Insights are not available for this post. |

