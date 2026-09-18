> This page location: Facebook Video API > video-api/reference
> Source: https://developers.facebook.com/documentation/video-api/reference

# Reference



## Video Specifications

### Video Settings

**Aspect Ratio**: 9x16, 16x9  
**Formats**:
3g2, 3gp, 3gpp, asf, avi, dat, divx, dv, f4v, flv, gif, m2ts, m4v, mkv, mod, mov, mp4, mpe, mpeg, mpeg4, mpg, mts, nsv, ogm, ogv, qt, tod, ts, vob, and wmv.

### Audio Settings

**Sample Rate**: 48 kHz  
**Channel Layout**: Stereo or Mono  
**Codec**: AAC  
**Bit Rate**: up to 256 kbps

## Endpoints

### Groups

| Endpoint | Description |
| --- | --- |
| [`GET /&#123;group-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/group/videos#reading) | Get a list of Videos on a Group. |
| [`POST /&#123;group-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/group/videos#creating) | Create or crosspost a Video on a Group. |

### Pages

| Endpoint | Description |
| --- | --- |
| [`GET /&#123;page-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/page/videos#reading) | Get a list of Videos on a Page. |
| [`POST /&#123;page-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/page/videos#creating) | Create or crosspost a Video on a Page. |

### Users

| Endpoint | Description |
| --- | --- |
| [`GET /&#123;user-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/user/videos) | Get a list of Videos of a User. |

### Video

| Endpoint | Description |
| --- | --- |
| [`GET /&#123;video-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/video#reading) | Get fields and edges on a published Video. |
| [`GET /&#123;video-id&#125;/captions`](https://developers.facebook.com/docs/graph-api/reference/video/captions) | Get VideoCaptions on a Video. |
| [`GET /&#123;video-id&#125;/comments`](https://developers.facebook.com/docs/graph-api/reference/video/comments) | Get VideoComments on a Video. |
| [`GET /&#123;video-id&#125;/crosspost_shared_pages`](https://developers.facebook.com/docs/graph-api/reference/video/crosspost_shared_pages) | Get a list of Pages this Video is being shared to. |
| [`GET /&#123;video-id&#125;/likes`](https://developers.facebook.com/docs/graph-api/reference/video/likes) | Get Likes on a Video. |
| [`GET /&#123;video-id&#125;/poll_settings`](https://developers.facebook.com/docs/graph-api/reference/video/poll_settings) | Get VideoPollSettings on a Video. |
| [`GET /&#123;video-id&#125;/polls`](https://developers.facebook.com/docs/graph-api/reference/video/polls) | Get VidoePolls on a Video. |
| [`GET /&#123;video-id&#125;/shared_posts`](https://developers.facebook.com/docs/graph-api/reference/video/sharedposts) | Get VideoSharedPosts on a Video. |
| [`GET /&#123;video-id&#125;/sponsor_tags`](https://developers.facebook.com/docs/graph-api/reference/video/sponsor_tags) | Get VideoSponsorTags on a Video. |
| [`GET /&#123;video-id&#125;/tags`](https://developers.facebook.com/docs/graph-api/reference/video/tags) | Get VideoTags on a Video. |
| [`GET /&#123;video-id&#125;/thumbnails`](https://developers.facebook.com/docs/graph-api/reference/video/thumbnails) | Get VideoThumbnails on a Video. |
| [`GET /&#123;video-id&#125;/video_insights`](https://developers.facebook.com/docs/graph-api/reference/video/video_insights) | Get VideoInsights on a Video. |
| [`POST /&#123;video-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/video#Creating) | Create or update fields and edges on a published Video. |
| [`POST /&#123;video-id&#125;/captions`](https://developers.facebook.com/docs/graph-api/reference/video/captions#Updating) | Update VideoCaptions on a Video. |
| [`POST /&#123;video-id&#125;/comments`](https://developers.facebook.com/docs/graph-api/reference/video/comments#Creating) | Create VideoComments on a Video. |
| [`POST /&#123;video-id&#125;/polls`](https://developers.facebook.com/docs/graph-api/reference/video/polls#Creating) | Create VideoPolls on a Video. |
| [`POST /&#123;video-id&#125;/thumbnails`](https://developers.facebook.com/docs/graph-api/reference/video/thumbnails#Creating) | Create VideoThumbnails on a Video. |
| [`DELETE /&#123;video-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/video#Deleting) | Delete a published Video. |
| [`DELETE /&#123;video-id&#125;/captions`](https://developers.facebook.com/docs/graph-api/reference/video/captions#Deleting) | Delete VideoCaptions on a Video. |

