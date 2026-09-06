# PostUserInfos API

Endpoint resource `PostUserInfo` — post + info akses user (termasuk draft).

> API Reference / PostUserInfos

---

## GET /users/{userId}/blogs/{blogId}/posts

List post blog dengan konteks user (termasuk draft milik user).

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs/BLOG_ID/posts?status=draft" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `userId` (string, path, wajib) — `self`.
- `blogId` (long, path, wajib).
- `endDate` (datetime, query, optional).
- `fetchBodies` (boolean, query, optional) — default `true`.
- `labels` (string, query, optional).
- `limit` (unsigned integer, query, optional) — maksimum 25.
- `orderBy` (string, query, optional) — `published` (default) / `updated`.
- `pageToken` (string, query, optional).
- `startDate` (datetime, query, optional).
- `status` (string, query, optional, dapat diulang) — `draft`, `live`, `scheduled`.
- `view` (string, query, optional) — `USER` / `READER` / `ADMIN`.

### Response

```json
{
  "kind": "blogger#postUserInfoList",
  "nextPageToken": "...",
  "items": [
    {
      "kind": "blogger#postUserInfo",
      "post": { "kind": "blogger#post", "...": "..." },
      "post_user_info": { "kind": "blogger#postPerUserInfo", "hasDraftAccess": true, "...": "..." }
    }
  ]
}
```

---

## GET /users/{userId}/blogs/{blogId}/posts/{postId}

Satu post dengan konteks user.

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `maxComments` (unsigned integer, query, optional).
- `view` (string, query, optional).

### Response

Objek `PostUserInfo`.

### Errors

- `403` — user tidak punya akses draft.
- `404 postNotFound`.

---

## Lihat Juga

- Model data: [../resources/post-user-info.md](../resources/post-user-info.md)
- Draft vs live list: `status` parameter di [posts.md](posts.md)
