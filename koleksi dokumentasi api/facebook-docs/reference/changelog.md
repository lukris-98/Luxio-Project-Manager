> This page location: Facebook Pages API > pages-api/changelog
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/changelog

# Changelog



Facebook Pages and related endpoints and fields will be made available for the new Pages experience in the future.

## January 30, 2026

#### [New] Page Integrity API

You can now get real-time integrity information for a page via the [Page Integrity Webhook and API](https://developers.facebook.com/documentation/pages-api/integrity-webhook#page-integrity-webhook). This includes the integrity status, violations, restrictions, recommended actions (e.g. file an appeal) and appeal status.

## November, 15 2025

#### Page Insights API Updates

_Applies to all versions._

On November 15, 2025, a number of the Page Insights metrics will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2025/08/15/page-insights-api-updates/)

- `page_fans (Alternative: page_follows)`

- `Page_fans_locale`

- `Page_fans_city (Alternative: page_follows_city)`

- `Page_fans_country (Alternative: page_follows_country)`

- `Page_fan_adds`

- `Page_fan_adds_unique`

- `Page_fan_removes`

- `page_fan_removes_unique*`

- `page_impressions* (Alternative: page_media_view)`

- `page_impressions_paid* (Alternative: page_media_view with is_from_ads breakdown)`

- `page_impressions_viral*`

- `page_impressions_nonviral*`

- `post_impressions* (Alternative: post_media_view)`

- `post_impressions_paid* (Alternative: post_media_view with is_from_ads breakdown)`

- `post_impressions_fan* (Alternative: post_media_view with is_from_followers breakdown)`

- `post_impressions_organic* (Alternative: post_media_view with is_from_ads breakdown)`

- `post_impressions_viral*`

- `post_impressions_nonviral*`

## September, 16 2024

#### Page Insights API Updates

_Applies to all versions._

The following Page Insights metrics have been deprecated for all API versions. The API returns an invalid metric error when calling any of these metrics.

* `page_call_phone_clicks_logged_in_by_locale_unique`
* `page_call_phone_clicks_logged_in_count`  
* `page_call_phone_clicks_logged_in_unique`
* `page_consumptions_by_consumption_type`
* `page_consumptions_by_consumption_type_unique`
* `page_consumptions_unique`
* `page_cta_clicks_logged_in_total`
* `page_cta_clicks_logged_in_unique`
* `page_daily_follows_by_paid_non_paid_unique`
* `page_daily_follows_by_source`
* `page_daily_follows_by_source_unique`
* `page_daily_unfollows_by_source`
* `page_daily_unfollows_by_source_unique`
* `page_fans_by_like_source`
* `page_fans_by_like_source_unique`
* `page_fans_by_unlike_source`
* `page_fans_by_unlike_source_unique`
* `page_fans_online`
* `page_fans_online_per_day`
* `page_get_directions_clicks_logged_in_count`
* `page_get_directions_clicks_logged_in_unique`
* `page_impressions_by_age_gender_unique`
* `page_impressions_by_city_unique`
* `page_impressions_by_country_id_unique`
* `page_impressions_by_country_unique`
* `page_impressions_by_locale_unique`
* `page_impressions_by_paid_non_paid`
* `page_impressions_by_paid_non_paid_unique`
* `page_impressions_by_story_type`
* `page_impressions_by_story_type_unique`
* `page_impressions_organic_unique_v2`
* `page_impressions_organic_v2`
* `page_impressions_frequency_distribution`
* `page_impressions_viral_frequency_distribution`
* `page_negative_feedback`
* `page_negative_feedback_by_type`
* `page_negative_feedback_by_type_unique`
* `page_negative_feedback_unique`
* `page_places_checkin_total`
* `page_places_checkin_total_unique`
* `page_palces_checkins_by_age_gender`
* `page_places_checkins_by_city`
* `page_places_checkins_by_country`
* `page_places_checkins_by_locale`
* `page_posts_impressions_by_paid_non_paid`
* `page_posts_impressions_by_paid_non_paid_unique`
* `page_posts_impressions_frequency_distribution`
* `page_posts_impressions_organic`
* `page_posts_impressions_organic_unique`
* `page_posts_impressions_organic_v2 (on hold)`
* `page_story_adds_by_country_unique`
* `page_tab_views_login_top`
* `page_tab_views_login_top_unique`
* `page_tab_views_logout_top`
* `page_views`
* `page_views_external_referrals`
* `page_views_login_unique`
* `page_views_login`
* `page_views_logout`
* `page_views_unique`
* `page_website_clicks_logged_in_by_city_unique`
* `page_website_clicks_logged_in_by_country_unique`
* `page_website_clicks_logged_in_by_locale_unique`
* `page_website_clicks_logged_in_count`
* `page_website_clicks_logged_in_unique`
* `post_clicks_unique*`
* `post_clicks_by_type_unique`
* `post_cta_clicks_by_type`
* `post_cta_clicks_total`
* `post_engaged_fan`
* `post_engaged_users*`
* `post_impressions_by_paid_non_paid`
* `post_impressions_by_story_type*`
* `post_impressions_by_story_type_unique*`
* `post_negative_feedback*`
* `post_negative_feedback_by_type*`
* `post_negative_feedback_by_type_unique*`
* `post_negative_feedback_unique*`

## June 17, 2024

#### Page Insights API Updates

_Applies to all versions._

On September 16, 2024, a number of the Page Insights metrics will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2024/06/17/page-insights-metrics-removal/)

* `page_call_phone_clicks_logged_in_by_locale_unique`
* `page_call_phone_clicks_logged_in_count`  
* `page_call_phone_clicks_logged_in_unique`
* `page_consumptions_by_consumption_type`
* `page_consumptions_by_consumption_type_unique`
* `page_consumptions_unique`
* `page_cta_clicks_logged_in_total`
* `page_cta_clicks_logged_in_unique`
* `page_daily_follows_by_paid_non_paid_unique`
* `page_daily_follows_by_source`
* `page_daily_follows_by_source_unique`
* `page_daily_unfollows_by_source`
* `page_daily_unfollows_by_source_unique`
* `page_fans_by_like_source`
* `page_fans_by_like_source_unique`
* `page_fans_by_unlike_source`
* `page_fans_by_unlike_source_unique`
* `page_fans_online`
* `page_fans_online_per_day`
* `page_get_directions_clicks_logged_in_count`
* `page_get_directions_clicks_logged_in_unique`
* `page_impressions_by_age_gender_unique`
* `page_impressions_by_city_unique`
* `page_impressions_by_country_id_unique`
* `page_impressions_by_country_unique`
* `page_impressions_by_locale_unique`
* `page_impressions_by_paid_non_paid`
* `page_impressions_by_paid_non_paid_unique`
* `page_impressions_by_story_type`
* `page_impressions_by_story_type_unique`
* `page_impressions_organic_unique_v2`
* `page_impressions_organic_v2`
* `page_impressions_frequency_distribution`
* `page_impressions_viral_frequency_distribution`
* `page_negative_feedback`
* `page_negative_feedback_by_type`
* `page_negative_feedback_by_type_unique`
* `page_negative_feedback_unique`
* `page_places_checkin_total`
* `page_places_checkin_total_unique`
* `page_palces_checkins_by_age_gender`
* `page_places_checkins_by_city`
* `page_places_checkins_by_country`
* `page_places_checkins_by_locale`
* `page_posts_impressions_by_paid_non_paid`
* `page_posts_impressions_by_paid_non_paid_unique`
* `page_posts_impressions_frequency_distribution`
* `page_posts_impressions_organic`
* `page_posts_impressions_organic_unique`
* `page_posts_impressions_organic_v2 (on hold)`
* `page_story_adds_by_country_unique`
* `page_tab_views_login_top`
* `page_tab_views_login_top_unique`
* `page_tab_views_logout_top`
* `page_views`
* `page_views_external_referrals`
* `page_views_login_unique`
* `page_views_login`
* `page_views_logout`
* `page_views_unique`
* `page_website_clicks_logged_in_by_city_unique`
* `page_website_clicks_logged_in_by_country_unique`
* `page_website_clicks_logged_in_by_locale_unique`
* `page_website_clicks_logged_in_count`
* `page_website_clicks_logged_in_unique`
* `post_clicks_unique*`
* `post_clicks_by_type_unique`
* `post_cta_clicks_by_type`
* `post_cta_clicks_total`
* `post_engaged_fan`
* `post_engaged_users*`
* `post_impressions_by_paid_non_paid`
* `post_impressions_by_story_type*`
* `post_impressions_by_story_type_unique*`
* `post_negative_feedback*`
* `post_negative_feedback_by_type*`
* `post_negative_feedback_by_type_unique*`
* `post_negative_feedback_unique*`

## March 14, 2024

#### Page Insights Metrics Deprecation

_Applies to all versions._

On March 14, 2024, a number of the [Page Insights metrics](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics) will be deprecated for all API versions. The API will return an invalid metric error when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2023/12/14/page-insights-metrics-deprecation)

## December 14, 2023

#### Page Insights Metrics Deprecation

_Applies to all versions on March 14, 2024._

On March 14, 2024, a number of the Page Insights metrics will be deprecated for all API versions. The API will return an invalid metric error  when calling any of these metrics. [Learn more.](https://developers.facebook.com/blog/post/2023/12/14/page-insights-metrics-deprecation)

- `page_actions_post_reactions_anger_total`

- `page_actions_post_reactions_haha_total`

- `page_actions_post_reactions_like_total`

- `page_actions_post_reactions_love_total`

- `page_actions_post_reactions_sorry_total`

- `page_actions_post_reactions_total`

- `page_actions_post_reactions_wow_total`

- `page_call_phone_clicks_by_age_gender_logged_in_unique`

- `page_call_phone_clicks_by_site_logged_in_unique`

- `page_call_phone_clicks_logged_in_by_city_unique`

- `page_call_phone_clicks_logged_in_by_country_unique`

- `page_call_phone_clicks_logged_in_by_locale_unique`

- `page_consumptions`

- `page_content_activity`

- `page_content_activity_by_action_type`

- `page_content_activity_by_action_type_unique`

- `page_content_activity_by_age_gender_unique`

- `page_content_activity_by_city_unique`

- `page_content_activity_by_country_unique`

- `page_content_activity_by_locale_unique`

- `page_content_activity_unique`

- `page_cta_clicks_by_age_gender_logged_in_unique`

- `page_cta_clicks_by_site_logged_in_unique`

- `page_cta_clicks_logged_in_by_city_unique`

- `page_cta_clicks_logged_in_by_country_unique`

- `page_cta_clicks_logged_in_by_locale_unique`

- `page_daily_follows_by_source_unique`

- `page_daily_unfollows_by_source_unique`

- `page_engaged_users`

- `page_fans_by_like_source_unique`

- `page_fans_by_like_source`

- `page_fans_by_unlike_source_unique`

- `page_fans_by_unlike_source`

- `page_fans_gender_age`

- `page_follows_city`

- `page_follows_country`

- `page_follows_gender_age`

- `page_follows_locale`

- `page_get_directions_clicks_by_age_gender_logged_in_unique`

- `page_get_directions_clicks_by_site_logged_in_unique`

- `page_get_directions_clicks_logged_in_by_city_unique`

- `page_get_directions_clicks_logged_in_by_country_unique`

- `page_impressions_frequency_distribution`

- `page_places_checkin_mobile_unique`

- `page_places_checkin_mobile`

- `page_places_checkins_by_age_gender`

- `page_places_checkins_by_city`

- `page_places_checkins_by_country`

- `page_places_checkins_by_locale`

- `page_positive_feedback_by_type_unique`

- `page_positive_feedback_by_type`

- `page_positive_feedback_unique`

- `page_positive_feedback`

- `page_posts_impressions_frequency_distribution`

- `page_views_by_age_gender_logged_in_unique`

- `page_views_by_city_logged_in_unique`

- `page_views_by_country_logged_in_unique`

- `page_views_by_internal_referer_logged_in_unique`

- `page_views_by_locale_logged_in_unique`

- `page_views_by_profile_tab_logged_in_unique`

- `page_views_by_profile_tab_total`

- `page_views_by_referers_logged_in_unique`

- `page_views_by_site_logged_in_unique`

- `page_views_external_referrals`

- `page_views_logged_in_total`

- `page_views_logged_in_unique`

- `page_views_login_unique`

- `page_views_login`

- `page_views_logout`

- `page_website_clicks_by_age_gender_logged_in_unique`

- `page_website_clicks_by_site_logged_in_unique`

- `page_website_clicks_logged_in_by_city_unique`

- `page_website_clicks_logged_in_by_country_unique`

- `page_website_clicks_logged_in_by_locale_unique`

- `post_activity`

- `post_activity_by_action_type`

- `post_activity_by_action_type_unique`

- `post_activity_unique`

- `post_impressions_fan_paid_unique*`

- `post_impressions_fan_paid*`

## 2021-06-21

* The Page `impressum` field is now available.

## 2021-03-18

* To determine if a Page has been migrated to the new Pages experience, use the new [Page `has_transitioned_to_new_page_experience` field](https://developers.facebook.com/docs/graph-api/reference/page).

## 2021-03-25

* [`POST /&#123;page-id&#125;/messages`](https://developers.facebook.com/docs/graph-api/reference/page/messages)
* [`POST /&#123;page-id&#125;/messenger_profile`](https://developers.facebook.com/docs/graph-api/reference/page/messenger_profile)

## 2021-01-04

Additional endpoints are now available for the new Pages experience.

* [` POST /&#123;album-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/album/photos)
* [`POST /&#123;canvas-button-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/canvas-button)
* [`POST /&#123;canvas-carousel-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/canvas-carousel)
* [`POST /&#123;canvas-text-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/canvas-text)  
* [`DELETE /&#123;comment-id&#125;/likes`](https://developers.facebook.com/docs/graph-api/reference/object/likes)
* [`GET /&#123;comment-id&#125;/reactions`](https://developers.facebook.com/docs/graph-api/reference/object/reactions)
* [`GET /&#123;lead-id&#125;`](https://developers.facebook.com/docs/marketing-api/reference/user-lead-gen-info)
* [`GET /&#123;link-id&#125;/comments`](https://developers.facebook.com/docs/graph-api/reference/object/comments)
* [`/&#123;media-fingerprint-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/media-fingerprint)
* [`DELETE /&#123;page-id&#125;/blocked`](https://developers.facebook.com/docs/graph-api/reference/page/blocked)
* [`/&#123;page-id&#125;/copyright_whitelisted_partners`](https://developers.facebook.com/docs/graph-api/reference/page/copyright_whitelisted_partners)
* [`/&#123;page-id&#125;?fields=copyright_whitelisted_ig_partners`](https://developers.facebook.com/docs/graph-api/reference/page#fields)
* [`GET /&#123;page-id&#125;/crosspost_whitelisted_pages`](https://developers.facebook.com/docs/graph-api/reference/page/crosspost_whitelisted_pages)

* [`POST /&#123;page-id&#125;/picture`](https://developers.facebook.com/docs/graph-api/reference/page/picture)
* [`GET /&#123;page-id&#125;/roles`](https://developers.facebook.com/docs/graph-api/reference/page/roles)
* [`/&#123;page-id&#125;/settings`](https://developers.facebook.com/docs/graph-api/reference/page/settings)
* [`GET /&#123;pagepost-id&#125;/to`](https://developers.facebook.com/docs/graph-api/reference/pagepost)
* [`DELETE /&#123;photo-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/photo)
* [`GET /&#123;photo-id&#125;/likes`](https://developers.facebook.com/docs/graph-api/reference/photo/likes)
* [`GET /&#123;photo-id&#125;/picture`](https://developers.facebook.com/docs/graph-api/reference/photo/picture)
* [`DELETE /&#123;post-id&#125;/likes`](https://developers.facebook.com/docs/graph-api/reference/object/likes)
* [`POST /&#123;video-id&#125;/thumbnails`](https://developers.facebook.com/docs/graph-api/reference/video/thumbnails)

## 2020-10-02

* Facebook begins migrating select Pages to the [new Pages experience](https://www.facebook.com/business/help/NewPagesExperience)

### Available Endpoints for the New Pages Experience

| Endpoint | Unavailable Fields |
| --- | --- |
| [`/&#123;comment-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/comment) |  |
| [`/&#123;comment-id&#125;/comments`](https://developers.facebook.com/docs/graph-api/reference/object/comments) |  |
| [`/&#123;live-video-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/live-video) |  |
| [`/&#123;media-fingerprint-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/media-fingerprint) |  |
| [`/&#123;page-id&#125;/conversations`](https://developers.facebook.com/docs/graph-api/reference/page/conversations) |  |
| [`/&#123;page-id&#125;/copyright_whitelisted_partners`](https://developers.facebook.com/docs/graph-api/reference/page/copyright_whitelisted_partners) |  |
| [`/&#123;page-id&#125;/feed`](https://developers.facebook.com/docs/graph-api/reference/page/feed) | `GET` fields:&lt;br&gt;&lt;br&gt;* `child_attachments`&lt;br&gt;* `feed_targeting`&lt;br&gt;* `scheduled_publish_time`&lt;br&gt;&lt;br&gt;`POST` fields:&lt;br&gt;&lt;br&gt;* `backdated_time_granularity`&lt;br&gt;* `child_attachments`&lt;br&gt;* `feed_targeting`&lt;br&gt;* `multi_share_end_card`&lt;br&gt;* `multi_share_optimized`&lt;br&gt;* `published`&lt;br&gt;* `scheduled_publish_time` |
| [`/&#123;page-id&#125;/live_videos`](https://developers.facebook.com/docs/graph-api/reference/page/live_videos) |  |
| [`/&#123;page-id&#125;/media_fingerprints`](https://developers.facebook.com/docs/graph-api/reference/page/media_fingerprints) |  |
| [`/&#123;page-id&#125;/posts`](https://developers.facebook.com/docs/graph-api/reference/page/feed) |  |
| [`/&#123;page-id&#125;/promotable_posts`](https://developers.facebook.com/docs/graph-api/reference/page/feed#promotable-ids) | `GET` fields:&lt;br&gt;&lt;br&gt;* `child_attachments`&lt;br&gt;* `feed_targeting` |
| [`/&#123;page-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/page/videos) |  |
| [`/&#123;page-id&#125;/videos`](https://developers.facebook.com/docs/graph-api/reference/page/videos) |  |
| [`GET /&#123;page-name&#125;/feed`](https://developers.facebook.com/docs/graph-api/reference/page/feed) |  |
| [` GET /&#123;page-name&#125;/posts`](https://developers.facebook.com/docs/graph-api/reference/page/feed) |  |
| [`/&#123;pagepost-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/pagepost) | `GET` fields:&lt;br&gt;&lt;br&gt;* `backdated_time`&lt;br&gt;* `child_attachments`&lt;br&gt;* `feed_targeting`&lt;br&gt;* `scheduled_publish_time` |
| [`/&#123;pagepost-id&#125;/comments`](https://developers.facebook.com/docs/graph-api/reference/pagepost/comments) |  |
| [`/&#123;pagepost-id&#125;/likes`](https://developers.facebook.com/docs/graph-api/reference/pagepost/likes) |  |
| [`/&#123;pagepost-id&#125;/reactions`](https://developers.facebook.com/docs/graph-api/reference/pagepost/reactions) |  |
| [`/&#123;post-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/post) |  |
| [`/&#123;post-id&#125;/comments`](https://developers.facebook.com/docs/graph-api/reference/post/comments) |  |
| [`/&#123;post-id&#125;/reactions`](https://developers.facebook.com/docs/graph-api/reference/post/reactions) |  |
| [`GET /&#123;user-id&#125;/accounts`](https://developers.facebook.com/docs/graph-api/reference/user/accounts) |  |
| [`/&#123;video-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/video) |  |
| [`/&#123;video-id&#125;/video_insights`](https://developers.facebook.com/docs/graph-api/reference/video/video_insights) |  |
| [`/&#123;video_copyright_rule-id&#125;`](https://developers.facebook.com/docs/graph-api/reference/video-copyright-rule) |  |

