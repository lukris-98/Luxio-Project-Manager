> This page location: Threads API > threads/reference/location-search
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/location-search

# Location Search



The Threads location search endpoint allows you to search for locations which can then be tagged in Threads posts. See [Location Tagging](https://developers.facebook.com/documentation/threads/create-posts/location-tagging) for more information.

## `GET /location_search`

Search for locations by query or by coordinates.

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `query`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;The query string to search for. |
| `latitude`&lt;br&gt;&lt;br&gt;float | **Optional.**  &lt;br&gt;The latitude coordinate to search for. This must be used with `longitude`. |
| `longitude`&lt;br&gt;&lt;br&gt;float | **Optional.**  &lt;br&gt;The longitude coordinate to search for. This must be used with `latitude`. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `name`, `address`, `city`, `country`, `latitude`, `longitude`, `postal_code` |

