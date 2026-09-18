> This page location: Facebook Pages API > pages-api/pages/upcoming-changes
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/pages/upcoming-changes

# Page Upcoming Changes API



This document explains how to use the Page Upcoming Changes API to view and accept or reject changes suggested by Facebook to fix possible errors on your Facebook Page.

## Before You Start

You will need:

- the [`pages_manage_metadata` permission](https://developers.facebook.com/documentation/pages-api/overview#permissions)

- a [Page access token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) requested by a person who is able to perform the [`MODERATE` task](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#page-tasks) on the Page that is being queried

## Get Proposed Changes

Send a `GET` request to the `/&#123;page-id&#125;`:

```
curl -i -X GET &quot;https://graph.facebook.com/&#123;page-id&#125;
    ?access_token=&#123;page-access-token&#125;&quot;
```

On success, your app receives the following response:

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;&#123;proposed-change-1-id&#125;&quot;,
      &quot;page&quot;: &#123;
        &quot;name&quot;: &quot;My Page&quot;,
        &quot;id&quot;: &quot;&#123;page-id&#125;&quot;
      &#125;,
      &quot;effective_time&quot;: &quot;2017-10-16T10:19:49+0000&quot;,
      &quot;timer_status&quot;: &quot;stopped&quot;,           //this proposal was accepted or rejected
      &quot;change_type&quot;: &quot;knowledge_proposal&quot;,
      &quot;proposal&quot;: &#123;
        &quot;id&quot;: &quot;1570719759662530&quot;,
        &quot;category&quot;: &quot;category&quot;,
        &quot;current_value&quot;: &quot;273819889375819, 161516070564222, 152142351517013&quot;,
        &quot;proposed_value&quot;: &quot;273819889375819, 161516070564222, 152142351517013, 273819889375819&quot;
      &#125;
    &#125;,
    &#123;
      &quot;id&quot;: &quot;&#123;proposed-change-2-id&#125;&quot;,
      &quot;page&quot;: &#123;
        &quot;name&quot;: &quot;My Page&quot;,
        &quot;id&quot;: &quot;&#123;page-id&#125;&quot;
      &#125;,
      &quot;effective_time&quot;: &quot;2017-11-21T07:03:54+0000&quot;,
      &quot;timer_status&quot;: &quot;already_fired&quot;,   //this proposal was automatically accepted
      &quot;change_type&quot;: &quot;knowledge_proposal&quot;,
      &quot;proposal&quot;: &#123;
        &quot;id&quot;: &quot;1603101113091061&quot;,
        &quot;category&quot;: &quot;category&quot;,
        &quot;current_value&quot;: &quot;273819889375819, 161516070564222, 152142351517013&quot;,
        &quot;proposed_value&quot;: &quot;273819889375819, 161516070564222, 152142351517013, 273819889375819&quot;,
        &quot;acceptance_status&quot;: &quot;accepted&quot;
      &#125;
    &#125;
  ]
&#125;
```

## Accept or Reject a Proposed Change

Send a `POST` request to the `/&#123;proposal-id&#125;` endpoint with the `accept` field set to `true` to accept the change or `false` to reject it:

```
curl -i -X POST &quot;https://graph.facebook.com/&#123;proposal-id&#125;
     ?accept=true
     &amp;access_token=&#123;page-access-token&#125;&quot;
```

On success, your app receives the following response:

```
&#123;
  &quot;succeed&quot;: true
&#125;
```

## Page Change Webhooks

[Subscribe](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages) to the `page_upcoming_change` and/or the `page_change_proposal`.

Your callback URL will receive the following notification for the `page_upcoming_change` webhook:

```
&#123;
  &quot;field&quot;: &quot;page_upcoming_change&quot;,
  &quot;action&quot;: &quot;pending&quot;, // can also be accepted_manually, accepted_automatically and rejected_manually
  &quot;value&quot;: &#123;
    &quot;id&quot;: &quot;123456&quot;, // id of upcoming change
    &quot;page&quot;: &#123;
      &quot;id&quot;: &quot;7878832&quot;, // id of page where the action is taken
      &quot;name&quot;: &quot;Page Name&quot;
    &#125;,
    &quot;effective_time&quot;: &quot;2017-03-01 12:00:00&quot;,
    &quot;change_type&quot;: &quot;knowledge_proposal&quot;,
    &quot;timer_status&quot;: &quot;active&quot;,
    &quot;proposal&quot;: &#123;
      &quot;id&quot;: &quot;id of the page change proposal&quot;,
      &quot;category&quot;: &quot;menu link&quot;,
      &quot;acceptance_status&quot;: &quot;pending&quot;, // can also be accepted or rejected
      &quot;current_value&quot;: &quot;https://www.oldmenu.com/&quot;,
      &quot;proposed_value&quot;: &quot;https://www.newmenu.com/&quot;
    &#125;
  &#125;
&#125;
```

Your callback URL will receive the following notification for the `page_change_proposal` webhook:

```
&#123;
  &quot;field&quot;: &quot;page_change_proposal&quot;,
  &quot;action&quot;: &quot;created&quot;,
  &quot;value&quot;: &#123;
    &quot;id&quot;: &quot;&#123;change-proposal-id&#125;&quot;,
    &quot;category&quot;: &quot;menu link&quot;,
    &quot;current_value&quot;: &quot;https://www.menuold.com/&quot;,
    &quot;proposed_value&quot;: &quot;https://www.menunew.com/&quot;,
    &quot;acceptance_status&quot;: &quot;pending&quot;
  &#125;
&#125;
```

## Reference

### Webhooks

| Webhook Field | Description |
| --- | --- |
| [`page_change_proposal`](https://developers.facebook.com/docs/graph-api/webhooks/reference/page#page_change_proposal) | Get real-time notifications of proposed changes suggested by Facebook for your Facebook Page. |
| [`page_upcoming_change`](https://developers.facebook.com/docs/graph-api/webhooks/reference/page#page_upcoming_change) | Get real-time notifications about upcoming changes that will occur on your Facebook Page. These changes have been suggested by Facebook and may or may not have a deadline to accept or reject before automatically taking affect. |

### Page Change Proposal Categories

A **Page Change Proposal** is a change proposed for your Page. It contains information such as category, the current page value, and the proposed value.

| Category Name | Parameter | Example Values |
| --- | --- | --- |
| Hotel Booking Service Link | `place_scraped_hotel_booking_website` | Current Value is always `-`, proposed value is a link to a hotel booking service. |
| Business Address | `place_address` | An array with format:&lt;br&gt;&lt;br&gt;`&#123;&quot;street&quot; : &quot;&#123;street-change&#125;&quot;,`&lt;br&gt;&lt;br&gt;`&quot;zip&quot; : &quot;&#123;zip-code-change&#125;&quot;,`&lt;br&gt;&lt;br&gt;`&quot;city&quot; : &quot;&#123;city-name-change&#125;&quot;&#125;`&lt;br&gt;&lt;br&gt;Only changed fields are shown in the response. |
| Business Type | `page_business_type` | `E-commerce`, `Service Area`, `Public Storefront`, `Workplace`, etc. |
| Category | `place_topic` | `Financial Service`, `Restaurant`, etc. |
| Coordinates | `place_coordinates` | Coordinates of the physical store. |
| Cover Photo | `timeline_cover_photo` | Link of the cover photo. |
| Email | `page_email` | Ex. mypagebiz&#064;email.com |
| Meal Type Served | `place_restaurant_good_for` | `Breakfast`, `Lunch`, `Dinner`, and `Coffee` |
| Menu Link | `place_scraped_menu` | Current Value is always `-`, proposed value is a link to a restaurant&#039;s menu. |
| Open Hours | `place_hours` | `Always Open`, `Permanently Closed` or `Hours Not Available` or the values shown in the [`hours` field](https://developers.facebook.com/docs/graph-api/reference/page). |
| Phone | `page_phone` | Ex. 650-555-1000 |
| Place Price Range | `place_price_range` | `$`, `$$`, `$$$`, `$$$$` |
| General Services Website | `place_scraped_service_website` | Current Value is always `-`. proposed value is a website. |
| Website | `page_website` | Ex. https://MyWebsite.com |

## See Also

- [Page Upcoming Change Reference Guide](https://developers.facebook.com/docs/graph-api/reference/page-upcoming-change)

