> This page location: Threads API > threads/reference/locations
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/reference/locations

# Locations



You can retrieve Threads location objects by individual ID. See [Location Tagging](https://developers.facebook.com/documentation/threads/create-posts/location-tagging) for more information.

## `GET /&#123;location-id&#125;`

Retrieve a location by its ID.

| Name | Description |
| --- | --- |
| `access_token`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;Threads Graph API user access token. |
| `location-id`&lt;br&gt;&lt;br&gt;string | **Required.**  &lt;br&gt;The path parameter of the Threads location identifier. |
| `fields`&lt;br&gt;&lt;br&gt;string | **Optional.**  &lt;br&gt;A comma-separated list of the fields to be returned.  &lt;br&gt;**Values:** `id` *(default)*, `name`, `address`, `city`, `country`, `latitude`, `longitude`, `postal_code` |

