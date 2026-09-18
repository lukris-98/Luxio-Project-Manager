> This page location: Facebook Video API > video-api/overview
> Source: https://developers.facebook.com/documentation/video-api/overview

# Overview for the Video API from Meta



The Video API is a collection of Graph API endpoints that allow apps to publish existing videos on [Pages](https://developers.facebook.com/docs/graph-api/reference/page) administered by app users.

## Components

### Host URL

All requests are passed to the `graph.facebook.com` host URL.

**Warning:** The `graph-video.facebook.com` host for video uploads has been deprecated. Use the `graph.facebook.com` host for API requests when uploading videos to Meta servers.

### Upload Protocols

Upload videos using the [Resumable Upload API](https://developers.facebook.com/documentation/video-api/guides/publishing#resumable-upload).

### Resources

The API uses the following nodes.

#### Videos

The [Video](https://developers.facebook.com/docs/graph-api/reference/video) node is the API&#039;s primary resource. When you upload an existing video the API generates a Video entity and publishes it on a [Page](https://developers.facebook.com/docs/graph-api/reference/page). Videos must be published on a target node.

####  Pages

Videos can be published on a Page as long as the app user can perform admin-equivalent [Tasks](https://developers.facebook.com/documentation/pages-api/overview#tasks) on the Page, or have been granted an Admin Role on the Page via the Business Manager.

#### Crossposted Videos

Videos that have already been published can also be [published on other Pages](https://developers.facebook.com/documentation/video-api/guides/crossposting) that the app user administers without having to be reuploaded. Insights on Crossposted Videos can be returned as aggregate values (e.g. the sum of all views across all Pages) or broken down by Page.

#### Slideshows

You can use the API to [generate a slideshow Video](https://developers.facebook.com/documentation/video-api/guides/slideshows) from a collection of images hosted on a public server.

#### Polls

You can use the API to [create Polls on published videos](https://developers.facebook.com/docs/graph-api/reference/video/polls) and get their results.

### Ads

Published Videos can be used with the Marketing API&#039;s [Ad Creative](https://developers.facebook.com/docs/marketing-api/advideo) endpoint to create Video Ads.

### Insights

You can [get insights](https://developers.facebook.com/documentation/video-api/guides/insights) on any published Video. Insights for [Crossposted Videos](#crossposted-videos) can be returned as aggregate values or broken down by Page.

### Webhooks

You can receive real-time notifications of changes to a Video&#039;s publishing status and viewer interactions by setting up [Page Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages). Set up a callback and then subscribe to the Page topic&#039;s `feed` and `videos` fields to receive notifications. Note that notification will not be sent for videos that are uploaded as `secret` or `no_story`.

### Rights Management

For Videos published on a Page, you can use the [Rights Manager API](https://developers.facebook.com/documentation/video-api/graph-api/rights-manager-api) to create and apply copyright rules in order to discover other published Videos that may be in violation, and report them.

### Requirements

#### Permissions

To publish on a Page, the app user must grant your app the [`pages_show_list`](https://developers.facebook.com/docs/permissions/reference/pages_show_list), [`pages_read_engagement`](https://developers.facebook.com/docs/permissions/reference/pages_read_engagement), and [`pages_manage_posts`](https://developers.facebook.com/docs/permissions/reference/pages_manage_posts) permissions.

#### Admin Role

The app user must be able to perform the equivalent of [`ADMIN` tasks](https://developers.facebook.com/documentation/pages-api/overview#tasks) on the targeted Page.

### App Review

All permissions require [App Review](https://developers.facebook.com/docs/apps/review).

## How It Works

The general flow for publishing a video on a Page is to:

1. Get an Access Token and appropriate permissions from your app user
1. Get a list of Pages that the app user is able to perform admin-equivalent Tasks on
1. Provide a way for the app user to select the Page where they want the video to appear
1. Provide a way for the app user to select a Video to be published.
1. Upload the video using the Resumable Upload API
1. Publish the video to the Page using the Video ID
