> This page location: Facebook Pages API > pages-api/search-pages
> Full documentation index: https://developers.facebook.com/documentation/pages-api.md
> Source: https://developers.facebook.com/documentation/pages-api/search-pages

# Search for a Page



This guide explains how to get information about Facebook Pages including names, locations, and more. Find Pages to [&#064;Mention](https://developers.facebook.com/documentation/pages-api/comments-mentions), Page locations, and tag a Page to show [branded content](https://www.facebook.com/business/help/788160621327601).

## Before You Start

You will need:

* A [User access token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#usertokens) and the [app secret](https://developers.facebook.com/documentation/facebook-login/security#appsecret) if the app user is logged into Facebook.
* An [App access token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) with the [Page Public Metadata Access](https://developers.facebook.com/docs/apps/features-reference#page-public-metadata-access) feature if the app user is not logged into Facebook and is searching for public Page information.
* An [App access token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) with the [Page Public Content Access](https://developers.facebook.com/docs/apps/features-reference#page-public-content-access) feature if the app user is not logged into Facebook and is searching Pages to conduct competitve analysis.

### Sample Request

```
curl -i -X GET \
  &quot;https://graph.facebook.com/pages/search?q=Facebook
  &amp;fields=id,name,location,link
  &amp;access_token=&#123;access-token&#125;&quot;
```

Returns a list of [Pages](https://developers.facebook.com/docs/graph-api/reference/page) that meet the query&#039;s criteria. Set the `q` parameter value to a keyword or search term (e.g. `q=Facebook`). Use the `fields` parameter to list any [fields](#fields) you want included with each Page returned in the response.

### Sample Response

```
&#123;
  &quot;data&quot;: [
    &#123;
      &quot;id&quot;: &quot;309968765748101&quot;,
      &quot;name&quot;: &quot;Facebook HQ&quot;,
      &quot;location&quot;: &#123;
        &quot;city&quot;: &quot;Menlo Park&quot;,
        &quot;country&quot;: &quot;United States&quot;,
        &quot;latitude&quot;: 37.483183,
        &quot;longitude&quot;: -122.149999,
        &quot;state&quot;: &quot;CA&quot;,
        &quot;street&quot;: &quot;1 Hacker Way&quot;,
        &quot;zip&quot;: &quot;94025&quot;
      &#125;,
      &quot;link&quot;: &quot;https://www.facebook.com/Facebook-HQ-166793820034304/&quot;
    &#125;,
    &#123;
      &quot;id&quot;: &quot;194776097220801&quot;,
      &quot;name&quot;: &quot;Facebook Seattle&quot;,
      &quot;location&quot;: &#123;
        &quot;city&quot;: &quot;Seattle&quot;,
        &quot;country&quot;: &quot;United States&quot;,
        &quot;latitude&quot;: 47.628293260721,
        &quot;longitude&quot;: -122.34263420105,
        &quot;state&quot;: &quot;WA&quot;,
        &quot;street&quot;: &quot;1101 Dexter Ave N&quot;,
        &quot;zip&quot;: &quot;98109&quot;
      &#125;,
      &quot;link&quot;: &quot;https://www.facebook.com/fbseattle/&quot;
    &#125;,
    ...
  ]
&#125;
```

## Fields

| Field Name | Description |
| --- | --- |
| `id` *int* | The ID of the Facebook Page. |
| `is_eligible_for_branded_content` *boolean* | Display whether the Facebook Page is eligible to post [branded content](https://www.facebook.com/business/help/788160621327601?id=1912903575666924). |
| `is_unclaimed` *boolean* | Display whether [a Facebook Page that was automatically generated has been claimed](https://business.facebook.com/help/168172433243582) by the business it represents, `is_unclaimed=false`, or not, `is_unclaimed=true`. |
| `link` *uri* | The link to the Facebook Page. |
| `location` *array* | The physical location of the business represented by the Facebook Page, if applicable. |
| ↳ `city` *string* | The city where the business represented by the Facebook Page is located. |
| ↳ `country` *string* | The country where the business represented by the Facebook Page is located. |
| ↳ `latitude` *float* | The latitude of the business represented by the Facebook Page. |
| ↳ `longitude` *float* | The longitude of the business represented by the Facebook Page. |
| ↳ `state` *string* | The state where the business represented by the Facebook Page is located. |
| ↳ `street` *string* | The street on which the business represented by the Facebook Page is located. |
| ↳ `zip` *int* | The postal code of the business represented by the Facebook Page. |
| `name` *string* | The name of the Facebook Page. |
| `verification_status` *string* | The [verification status of the Facebook Page](https://www.facebook.com/help/1288173394636262) that represents a  business, `blue_verified` or `not_verified`. |

## Limitations

* The `GET /search?type=place` endpoint is deprecated in v8.0+ and in all versions on Nov. 2, 2020.
* This endpoint does not return a Page&#039;s profile picture. Please see the [Page Reference](https://developers.facebook.com/docs/graph-api/reference/page/picture) for information on getting a Page&#039;s profile picture.
* Alias-based searches are not strongly supported and might not return pages that have a low fan following.

## Learn More

- [Branded Content Guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/branded-content)

- [Getting Started Guide](https://developers.facebook.com/documentation/pages-api)

- [&#064;Mention Guide](https://developers.facebook.com/documentation/pages-api/comments-mentions)

- [Page Locations Reference Doc](https://developers.facebook.com/docs/graph-api/reference/page/locations)

- [Page Reference Doc](https://developers.facebook.com/docs/graph-api/reference/page)

- [Rate Limit Guide](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

