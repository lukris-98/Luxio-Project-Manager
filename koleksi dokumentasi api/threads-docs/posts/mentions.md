> This page location: Threads API > threads/threads-mentions
> Full documentation index: https://developers.facebook.com/documentation/threads.md
> Source: https://developers.facebook.com/documentation/threads/threads-mentions

# Mentions



Returns a list of public Threads media objects in which a Threads profile has been tagged by another Threads profile.

### Permissions

The Threads Mentions API requires an appropriate access token and permissions based on the node you are targeting. While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer.

* `threads_basic` — Required for making any calls to all Threads API endpoints.
* `threads_manage_mentions` — Required for making any calls to the mentions endpoint.

If your app has not been approved for advanced access for the `threads_manage_mentions` permission, only mentions made by a Threads tester on the app will be returned. After approval, other users&#039; public posts will be returned.

### Limitations

* Threads media objects created by private users will not be returned.
* The `since` parameter&#039;s timestamp must be greater than or equal to `1688540400` and less than the `until` parameter, which must be less than or equal to the current timestamp and greater than the `since` parameter.

## Retrieve Threads Mentions

### Fields

Use the `fields` parameter to specify [fields](https://developers.facebook.com/documentation/threads/retrieve-and-discover-posts/retrieve-posts#fields) you want included on any returned Threads media objects.

### Example Request

```
curl -s -X GET \
  https://graph.threads.net/&lt;THREADS_USER_ID&gt;/mentions?fields=&lt;LIST_OF_FIELDS&gt;&amp;access_token=&lt;ACCESS_TOKEN&gt;
```

### Example Response

A successful API call returns a JSON-formatted object containing Threads media objects.

```
&#123;
  &quot;&lt;FIELD&gt;&quot;:&quot;&lt;VALUE&gt;&quot;,
  ...
&#125;
```
