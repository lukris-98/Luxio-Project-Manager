> This page location: Facebook Pages API > pages-api/manage-pages
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/manage-pages

# Manage a Page



This document shows you how to perform the following tasks for a Facebook Page:

* Get a list of pages that you can perform a task on including:
    * Specific tasks you can perform on each Page
    * Page access tokens for each Page that you can use to test API calls
* Get and update details about a Page
* Get and update settings for a Page
* Get notifications about suggested changes Meta will be implementing on a Page
    * Accept or reject these suggested changes
* Get reviews for a Page
* Block a person from a Page

## Before you start

This guide assumes you have read the [Pages API Overview](https://developers.facebook.com/documentation/pages-api/overview).

For a person who can perform tasks on the page, you will need to implement Facebook Login for Business to ask for the following permissions and receive a User or Page access token:

* `pages_manage_engagement`
* `pages_manage_metadata`
* `pages_manage_posts`  
* `pages_read_engagement`
* `pages_read_user_engagement`
* `pages_show_list`
* `publish_video` permission, if you are publishing a video to the Page

If using a business system user in your API requests, the `business_management` permission is required.

Your app user must be able to perform the `CREATE_CONTENT`, `MANAGE`, and/or `MODERATE` tasks on the Page in the API requests.

### Best practices

When testing an API call, you can include the `access_token` parameter set to your access token. However, when making secure calls from your app, use the [access token class.](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#portabletokens)

*Example requests are formatted for readability. Replace **bold, italics values**, such as **page_id**, with your values.*

## Pages, tasks, and tokens

A single API call can give you a lot of information for Pages on which you can perform a task.

### Get your Pages

To get a list of all Pages on which you can perform tasks, the tasks you can perform on each page, and a short-lived Page access token for each Page, send a `GET` request to `/user_id/accounts` endpoint using a User access token.

#### Example request

```curl
curl -i -X GET
     &quot;https://graph.facebook.com/user_id/accounts&quot;
```

On success, your app will receive a JSON response with an array of Page objects. Each Page object contains:

* The name for the Page
* The ID for the Page
* The Page category, category name and ID
* A short-lived Page access token
* All tasks the user can perform on the Page

#### Example response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;access_token&quot;: &quot;&#123;facebook-for-developers-page-access-token&#125;&quot;,
      &quot;category&quot;: &quot;Internet Company&quot;,
      &quot;category_list&quot;: [
        &#123;
          &quot;id&quot;: &quot;2256&quot;,
          &quot;name&quot;: &quot;Internet Company&quot;
        &#125;
      ],
      &quot;name&quot;: &quot;Facebook for Developers&quot;,
      &quot;id&quot;: &quot;&#123;facebook-for-developers-page-id&#125;&quot;,
      &quot;tasks&quot;: [
        &quot;ANALYZE&quot;,
        &quot;ADVERTISE&quot;,
        &quot;MODERATE&quot;,
        &quot;CREATE_CONTENT&quot;
      ]
    &#125;,
    &#123;
      &quot;access_token&quot;: &quot;&#123;my-outlandish-stories-page-access-token&#125;&quot;,
      &quot;category&quot;: &quot;Blogger&quot;,
      &quot;category_list&quot;: [
        &#123;
          &quot;id&quot;: &quot;361282040719868&quot;,
          &quot;name&quot;: &quot;Blogger&quot;
        &#125;
      ],
      &quot;name&quot;: &quot;My Outlandish Stories&quot;,
      &quot;id&quot;: &quot;&#123;my-outlandish-stories-page-id&#125;&quot;,
      &quot;tasks&quot;: [
        &quot;ANALYZE&quot;,
        &quot;ADVERTISE&quot;,
        &quot;MODERATE&quot;,
        &quot;CREATE_CONTENT&quot;,
        &quot;MANAGE&quot;
      ]
    &#125;,
...
  ]
&#125;
```

### Get tasks for others

If you can perform the `MANAGE` task on the Page, you can get a list of other people who can perform tasks on that Page including the tasks each person can perform.

To get a list of people and the tasks they can perform on the Page, send a `GET` request to the `/page_id/roles` endpoint.

#### Example request

```curl
curl -i -X GET &quot;https://graph.facebook.com/page_id/roles&quot;
```

On success, your app receives a JSON response with the person&#039;s name, their Page-scoped ID, and tasks each person can perform on a Page.

#### Example response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;name&quot;: &quot;Person One&quot;,
      &quot;id&quot;: &quot;page_scoped_id_for_one&quot;
        &quot;tasks&quot;: [
          &quot;ANALYZE&quot;
        ]
    &#125;,
    &#123;
      &quot;name&quot;: &quot;Person Two&quot;,
      &quot;id&quot;: &quot;page_scoped_id_for_two&quot;,
      &quot;tasks&quot;: [
        &quot;ANALYZE&quot;,
        &quot;ADVERTISE&quot;,
        &quot;MODERATE&quot;,
        &quot;CREATE_CONTENT&quot;,
        &quot;MANAGE&quot;
      ]
    &#125;,
...
  ],
&#125;
```

## Page details

If you can perform the `MANAGE` task on the Page, you can use a Page access token or if your app has been approved for the Page Public Content Access feature, you can use a User access token, to view details for a Page such as about, email, hours of operation, etc.

### Get details

To get details about a Page, send a `GET` request to the `/page_id` endpoint with the `fields` parameter set to the Page details you would like to view.

**Note:** You can use the `/pages/search` endpoint to find Page IDs when using the Page Public Content Access feature.

#### Example request

```curl
curl -i -X GET &quot;https://graph.facebook.com/page_id\
    ?fields=about,attire,bio,location,parking,hours,emails,website&quot;
```

On success, your app receives a JSON response with value for the fields you requested.  If a field is not returned in the response, the Page does not have this value set. For example, if the Page has not set the `attire` field, this field will not be returned in the response.

### Update details

If you can perform the `MANAGE` task on the Page, you can use a Page access token to send a `POST` request to the `/page_id` endpoint with the parameters that you want to update, such as the `about` parameter.

#### Example request

```curl
curl -i -X POST &quot;https://graph.facebook.com/v25.0/page_id&quot; \
     -H &quot;Content-Type: application/json&quot; \
     -d &#039;&#123;
           &quot;about&quot;:&quot;This is an awesome cafe located downtown!&quot;,
         &#125;&#039;
```

On success, your app will receive a JSON response with `success` set to `true`.

### Meta proposed changes

On occassion, Meta will propose changes to the details for your Page, such as fixing a typo, or updating the categories on your Page to help people better find your Page. In order to get these notifications, you must be subscribed to the `page_upcoming_change` and/or the `page_change_proposal` webhook.

Once you receive the notification, you can do one of the following:

* Do nothing and the changes will take affect at the time designated in the notification
* Actively accept the changes and the changes will take affect immediately
* Actively reject the changes and no changes will be made

#### Accept or reject a proposed change

To actively accept or reject a proposed change, send a `POST` request to the `/page_change_proposal_id` endpoint with the `accept` field set to `true` to accept the change or `false` to reject it.  The `page_change_proposal_id` is the `proposal.id` value you received in the `page_upcoming_change` webhook notification or `value.id` value you received in the `page_change_proposal` webhook notification.

```
curl -i -X POST &quot;https://graph.facebook.com/v25.0/page_change_proposal_id&quot; \
     -H &quot;Content-Type: application/json&quot; \
     -d &#039;&#123;
           &quot;accept&quot;:&quot;true&quot;,
         &#125;&#039;
```

On success, your app receives a JSON response with `success` set to `true`.

## Page settings &#123;#update_settings&#125;

If you can perform the `MANAGE` task on the Page, you can use a Page access token to send a `GET` request to the `/page_id/settings` endpoint to get a list of all the settings for that Page.

#### Example request

```curl
curl -i -X GET &quot;https://graph.facebook.com/v25.0/page_id/settings&quot;
```

On success, your app will receive a JSON response with an array of objects where each object is the `setting` set to a Page setting and the value, either `true` or `false`.

#### Example response

```json
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;setting&quot;: &quot;USERS_CAN_POST&quot;,
      &quot;value&quot;: false
    &#125;,
    &#123;
      &quot;setting&quot;: &quot;USERS_CAN_MESSAGE&quot;,
      &quot;value&quot;: true
    &#125;,
    &#123;
      &quot;setting&quot;: &quot;USERS_CAN_POST_PHOTOS&quot;,
      &quot;value&quot;: true
    &#125;,
    ...
  ]
&#125;
```

### Update a setting

To update the settings for a Page, send a `POST` request to the `/page_id/settings` endpoint with the `option` parameter set to the setting you want to update.

#### Example request

```
curl -i -X POST &quot;https://graph.facebook.com/v25.0/page_id/settings&quot; \
     -H &quot;Content-Type: application/json&quot; \
     -d &#039;&#123;
           &quot;option&quot;:&#123;&quot;USERS_CAN_MESSAGE&quot;: &quot;true&quot;&#125;,
         &#125;&#039;
```

On success, your app receives a JSON response with `success` set to `true`.

## Get reviews

You can get reviews for a Page, including the name of the reviewer, their Page-scoped ID, whether it was a positive or negative recommendation, and the review text, send a `GET` request to the `/page_id/ratings` endpoint.

#### Example request

```curl
curl -i -X GET &quot;https://graph.facebook.com/page_id/ratings&quot;
```

On success, your app receives a JSON array with review objects. Each object contains:

* `created_time` set to the time the review was created,
* `recommendation_type` set to `positive` or `negative`
* `review_text` set to the content for the review
* a `reviewer` object with the `name` and `id` for the person who wrote that review

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;created_time&quot;: &quot;unixtimestamp&quot;,
      &quot;recommendation_type&quot;: &quot;positive&quot;,
      &quot;review_text&quot;: &quot;I love this page!&quot;,
      &quot;reviewer&quot;: &#123;
        &quot;name&quot;: &quot;Person One&quot;,
        &quot;id&quot;: &quot;psid_for_one&quot;
      &#125;
    &#125;,
    &#123;
      &quot;created_time&quot;: &quot;unixtimestamp&quot;,
      &quot;recommendation_type&quot;: &quot;positive&quot;,
      &quot;review_text&quot;: &quot;This page is wonderful!&quot;,
      &quot;reviewer&quot;: &#123;
        &quot;name&quot;: &quot;Person Two&quot;,
        &quot;id&quot;: &quot;psid_for_two&quot;
      &#125;
    &#125;,
...
  ]
&#125;
```

## Block a person

To block a person from commenting on a Page, send a `POST` request to the `/page_id/blocked` endpoint with the `user` parameter set to Page-scoped ID for the person you want to block.

#### Example request

```curl
curl -i -X POST &quot;https://graph.facebook.com/v25.0/page_id/blocked&quot;
     -H &quot;Content-Type: application/json&quot; \
     -d &#039;&#123;
           &quot;user&quot;:&quot;psid_to_block&quot;,
         &#125;&#039;
```

On success, your app receives a JSON response with the Page-scoped ID set to `true`.

```
&#123;
 &quot;psid_to_block&quot;: true
&#125;
```

## Next steps

Learn how to [publish links, photos, and videos to your Page](https://developers.facebook.com/documentation/pages-api/posts).

## See also

- [Meta Webhooks for Pages](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages)

- [Meta Business Help Center – Business System User](https://www.facebook.com/business/help/327596604689624)

#### References

- [Page Reference](https://developers.facebook.com/docs/graph-api/reference/page)

- [Page Blocked Reference](https://developers.facebook.com/docs/graph-api/reference/page/blocked)

- [Page Feed Reference](https://developers.facebook.com/docs/graph-api/reference/page/feed)

- [Page Post Reference](https://developers.facebook.com/docs/graph-api/reference/page-post)

- [Page Settings](https://developers.facebook.com/docs/graph-api/reference/page/settings)

- [Page Upcoming Change Reference](https://developers.facebook.com/docs/graph-api/reference/page-upcoming-change)

- [Permissions Reference](https://developers.facebook.com/docs/permissions)

- [User Accounts Reference](https://developers.facebook.com/docs/graph-api/reference/user/accounts)

