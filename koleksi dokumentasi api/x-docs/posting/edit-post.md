> This page location: X Developer Platform > x-api/posts/create-or-edit-post
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/x-api/posts/create-or-edit-post.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Create Posts

<Warning>
  Quote-posting (using the `quote_tweet_id` parameter) requires an [Enterprise plan](/enterprise-api/introduction). It is not available on self-serve (pay-per-use) tiers.
</Warning>

Video attached via `media.media_ids` is subject to size and duration limits based on the posting user's X Premium / verified status and the `media_category` used at upload. A successful upload can still be rejected here with **403** `This user is not allowed to post a video longer than N minutes.` See [size and duration limits](/x-api/media/introduction#size-and-duration-limits).


## OpenAPI

````yaml post /2/tweets
openapi: 3.0.0
info:
  description: X API v2 core endpoints
  version: '2.168'
  title: X API v2
  termsOfService: https://developer.x.com/en/developer-terms/agreement-and-policy.html
  contact:
    name: X Developers
    url: https://developer.x.com/
  license:
    name: X Developer Agreement and Policy
    url: https://developer.x.com/en/developer-terms/agreement-and-policy.html
servers:
  - description: X API
    url: https://api.x.com
security: []
tags:
  - name: Account
    description: >-
      Endpoints for managing the authenticated user's X Developer Platform
      account
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/introduction
  - name: Account Activity
    description: Endpoints relating to retrieving, managing Account Activity subscriptions
    externalDocs:
      description: Find out more
      url: >-
        https://docs.x.com/x-api/enterprise-gnip-2.0/fundamentals/account-activity
  - name: Activity
    description: Endpoints relating to retrieving, managing activity subscriptions
    externalDocs:
      description: Find out more
      url: >-
        https://docs.x.com/x-api/enterprise-gnip-2.0/fundamentals/account-activity
  - name: Articles
    description: Endpoints related to retrieving, creating & modifying Articles
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/articles/introduction
  - name: Bots
  - name: Broadcasts
    description: Endpoints related to live broadcasts and their chat
    externalDocs:
      description: Find out more
      url: https://developer.x.com/
  - name: Chat
    description: Endpoints related to Chat encrypted messaging
    externalDocs:
      description: Find out more
      url: https://developer.x.com/
  - name: Communities
    description: Endpoints related to retrieving and managing Communities
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/communities/introduction
  - name: Community Notes
    description: Endpoints related to retrieving, searching, and modifying Community Notes
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/community-notes/introduction
  - name: Compliance
    description: Endpoints related to keeping X data in your systems compliant
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/compliance/batch-compliance/introduction
  - name: Connections
    description: Endpoints related to streaming connections
    externalDocs:
      description: Find out more
      url: https://developer.x.com/en/docs/x-api/connections
  - name: Direct Messages
    description: Endpoints related to retrieving, managing Direct Messages
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/direct-messages/introduction
  - name: General
    description: Miscellaneous endpoints for general API functionality
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/introduction
  - name: Lists
    description: Endpoints related to retrieving, managing Lists
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/lists/introduction
  - name: Media
    description: Endpoints related to retrieving and uploading Media
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/media/introduction
  - name: News
    description: Endpoint for retrieving news stories
    externalDocs:
      description: Find out more
      url: https://developer.x.com/
  - name: Posts
    description: Endpoints related to retrieving, searching, and modifying Posts
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/posts/introduction
  - name: Spaces
    description: Endpoints related to retrieving, managing Spaces
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/spaces/introduction
  - name: Stream
    description: Endpoints related to streaming
    externalDocs:
      description: Find out more
      url: https://developer.x.com/
  - name: Trends
    description: Endpoint for retrieving trends
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/trends/introduction
  - name: Usage
    description: Endpoints related to retrieving usage
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/usage/introduction
  - name: Users
    description: Endpoints related to retrieving, managing relationships of Users
    externalDocs:
      description: Find out more
      url: https://docs.x.com/x-api/users/introduction
  - name: Webhooks
    description: Endpoints relating to retrieving, managing webhooks and webhook configs
    externalDocs:
      description: Find out more
      url: >-
        https://docs.x.com/x-api/enterprise-gnip-2.0/fundamentals/account-activity
paths:
  /2/tweets:
    post:
      tags:
        - Posts
      summary: Create Posts
      operationId: createPosts
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePostsRequest'
        required: true
      responses:
        '201':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreatePostsResponse'
        default:
          description: The request has failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
            application/problem+json:
              schema:
                $ref: '#/components/schemas/Problem'
      security:
        - OAuth2UserToken:
            - users.read
            - tweet.read
            - tweet.write
        - UserToken: []
components:
  schemas:
    CreatePostsRequest:
      type: object
      properties:
        card_uri:
          type: string
          description: Card URI parameter.
        community_id:
          type: string
          description: Community to post the tweet to.
          pattern: ^[0-9]{1,19}$
        direct_message_deep_link:
          type: string
          description: Direct message deep link.
        edit_options:
          $ref: '#/components/schemas/CreatePostsEditOptions'
          description: Edit an existing tweet rather than creating a new one.
        for_super_followers_only:
          type: boolean
          description: Restrict tweet to super followers.
        geo:
          $ref: '#/components/schemas/CreatePostsGeo'
          description: Geo location for the tweet.
        made_with_ai:
          type: boolean
          description: Disclose that the tweet contains AI-generated media.
        media:
          $ref: '#/components/schemas/CreatePostsMedia'
          description: Media attachments.
        nullcast:
          type: boolean
          description: If true, the tweet is not shown in the public timeline.
        paid_partnership:
          type: boolean
          description: Disclose that the tweet is a paid partnership.
        poll:
          $ref: '#/components/schemas/CreatePostsPoll'
          description: Poll configuration.
        quote_tweet_id:
          type: string
          description: Tweet ID to quote.
          pattern: ^[0-9]{1,19}$
        reply:
          $ref: '#/components/schemas/CreatePostsReply'
          description: Tweet reply configuration.
        reply_settings:
          type: string
          description: Who can reply to this tweet.
          enum:
            - following
            - mentionedUsers
            - subscribers
            - verified
        share_with_followers:
          type: boolean
          description: Share an exclusive (super-follower) tweet with all followers.
        text:
          type: string
          description: >-
            Text of the tweet. Required unless media is provided.  Defaulted to
            an empty string so it is always sent: the backend's `tweet_text`
            variable is non-null and rejects an absent value.
          default: ''
      additionalProperties: false
    CreatePostsResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/CreatePostsResponseData'
        errors:
          type: array
          items:
            $ref: '#/components/schemas/Problem'
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
          format: int32
        message:
          type: string
    Problem:
      oneOf:
        - $ref: '#/components/schemas/ResourceNotFoundProblem'
        - $ref: '#/components/schemas/InvalidRequestProblem'
        - $ref: '#/components/schemas/NotAuthorizedForResourceProblem'
        - $ref: '#/components/schemas/NotAuthorizedForFieldProblem'
        - $ref: '#/components/schemas/FieldUnauthorizedProblem'
        - $ref: '#/components/schemas/FieldHydrationFailureProblem'
        - $ref: '#/components/schemas/ResourceUnavailableProblem'
        - $ref: '#/components/schemas/DisallowedResourceProblem'
        - $ref: '#/components/schemas/InternalErrorProblem'
      discriminator:
        propertyName: type
        mapping:
          https://api.x.com/2/problems/disallowed-resource:
            $ref: '#/components/schemas/DisallowedResourceProblem'
          https://api.x.com/2/problems/field-hydration-failure:
            $ref: '#/components/schemas/FieldHydrationFailureProblem'
          https://api.x.com/2/problems/field-unauthorized:
            $ref: '#/components/schemas/FieldUnauthorizedProblem'
          https://api.x.com/2/problems/internal-error:
            $ref: '#/components/schemas/InternalErrorProblem'
          https://api.x.com/2/problems/invalid-request:
            $ref: '#/components/schemas/InvalidRequestProblem'
          https://api.x.com/2/problems/not-authorized-for-field:
            $ref: '#/components/schemas/NotAuthorizedForFieldProblem'
          https://api.x.com/2/problems/not-authorized-for-resource:
            $ref: '#/components/schemas/NotAuthorizedForResourceProblem'
          https://api.x.com/2/problems/resource-not-found:
            $ref: '#/components/schemas/ResourceNotFoundProblem'
          https://api.x.com/2/problems/resource-unavailable:
            $ref: '#/components/schemas/ResourceUnavailableProblem'
    CreatePostsEditOptions:
      type: object
      required:
        - previous_post_id
      properties:
        previous_post_id:
          type: string
          description: The ID of the Post being edited.
          pattern: ^[0-9]{1,19}$
      additionalProperties: false
    CreatePostsGeo:
      type: object
      required:
        - place_id
      properties:
        place_id:
          type: string
          description: Place ID for geo tagging.
      additionalProperties: false
    CreatePostsMedia:
      type: object
      required:
        - media_ids
      properties:
        call_to_actions:
          $ref: '#/components/schemas/CreatePostsMediaCallToActions'
          description: Call-to-action button rendered on the media entity.
        description:
          type: string
          description: >-
            Description for the media, rendered on the Post card for video and
            Amplify content.
        embeddable:
          type: boolean
          description: >-
            When true, the media's asset URLs do not expire and external
            syndicated playback is allowed.
        media_ids:
          type: array
          description: Media IDs to attach to the tweet.
          minItems: 1
          maxItems: 4
          items:
            type: string
            pattern: ^[0-9]{1,19}$
        preview_media_id:
          type: string
          description: Media id whose asset is used as the preview image.
          pattern: ^[0-9]{1,19}$
        tagged_user_ids:
          type: array
          description: User IDs tagged in the media.
          maxItems: 10
          items:
            type: string
            pattern: ^[0-9]{1,19}$
        title:
          type: string
          description: >-
            Title for the media, rendered on the Post card for video and Amplify
            content.
      additionalProperties: false
    CreatePostsPoll:
      type: object
      required:
        - options
        - duration_minutes
      properties:
        duration_minutes:
          type: integer
          description: Duration of the poll in minutes.
          minimum: 5
          maximum: 10080
        options:
          type: array
          description: Poll options (2-4 choices, 1-25 characters each).
          minItems: 2
          maxItems: 4
          items:
            type: string
            minLength: 1
            maxLength: 25
        reply_settings:
          type: string
          description: >-
            Who can reply to the poll Tweet. Accepted for compatibility; it
            carries no backend argument and is dropped before the mutation is
            issued (see `translate_body`).
          enum:
            - following
            - mentionedUsers
            - subscribers
            - verified
      additionalProperties: false
    CreatePostsReply:
      type: object
      required:
        - in_reply_to_tweet_id
      properties:
        auto_populate_reply_metadata:
          type: boolean
          description: >-
            If true, reply metadata is automatically populated. Accepted for
            compatibility; it carries no backend argument and is dropped before
            the mutation is issued (see `translate_body`).
        exclude_reply_user_ids:
          type: array
          description: User IDs to exclude from the reply thread.
          items:
            type: string
        in_reply_to_tweet_id:
          type: string
          description: The ID of the tweet being replied to.
          pattern: ^[0-9]{1,19}$
      additionalProperties: false
    CreatePostsResponseData:
      type: object
      required:
        - id
        - text
      properties:
        edit_history_post_ids:
          type: array
          description: Post IDs in this Post's edit history chain.
          items:
            type: string
        id:
          type: string
          description: Unique identifier of the created Post.
          pattern: ^[0-9]{1,19}$
        text:
          type: string
          description: The content of the created Post.
    ResourceNotFoundProblem:
      type: object
      required:
        - type
        - title
        - detail
        - resource_type
      properties:
        detail:
          type: string
        parameter:
          type: string
        resource_id:
          type: string
        resource_type:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/resource-not-found
        value:
          type: string
    InvalidRequestProblem:
      type: object
      required:
        - type
        - title
        - detail
      properties:
        detail:
          type: string
        parameter:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/invalid-request
        value:
          type: string
    NotAuthorizedForResourceProblem:
      type: object
      required:
        - type
        - title
        - detail
        - resource_type
      properties:
        detail:
          type: string
        parameter:
          type: string
        resource_id:
          type: string
        resource_type:
          type: string
        section:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/not-authorized-for-resource
        value:
          type: string
    NotAuthorizedForFieldProblem:
      type: object
      required:
        - type
        - title
        - detail
        - field
      properties:
        detail:
          type: string
        field:
          type: string
        parameter:
          type: string
        resource_id:
          type: string
        resource_type:
          type: string
        section:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/not-authorized-for-field
        value:
          type: string
    FieldUnauthorizedProblem:
      type: object
      required:
        - type
        - title
        - detail
        - field
      properties:
        detail:
          type: string
        field:
          type: string
        resource_type:
          type: string
        section:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/field-unauthorized
    FieldHydrationFailureProblem:
      type: object
      required:
        - type
        - title
        - detail
        - field
      properties:
        detail:
          type: string
        field:
          type: string
        resource_type:
          type: string
        section:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/field-hydration-failure
    ResourceUnavailableProblem:
      type: object
      required:
        - type
        - title
        - detail
        - resource_type
      properties:
        detail:
          type: string
        resource_id:
          type: string
        resource_type:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/resource-unavailable
    DisallowedResourceProblem:
      type: object
      required:
        - type
        - title
        - detail
      properties:
        detail:
          type: string
        resource_id:
          type: string
        resource_type:
          type: string
        section:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/disallowed-resource
    InternalErrorProblem:
      type: object
      required:
        - type
        - title
        - detail
      properties:
        detail:
          type: string
        status:
          type: integer
        title:
          type: string
        type:
          type: string
          enum:
            - https://api.x.com/2/problems/internal-error
    CreatePostsMediaCallToActions:
      type: object
      properties:
        app_install:
          $ref: '#/components/schemas/CreatePostsMediaCallToActionsAppInstall'
          description: App Install CTA. At least one store id should be provided.
        visit_site:
          $ref: '#/components/schemas/CreatePostsMediaCallToActionsVisitSite'
          description: Visit Site CTA.
        watch_now:
          $ref: '#/components/schemas/CreatePostsMediaCallToActionsWatchNow'
          description: Watch Now CTA.
      additionalProperties: false
    CreatePostsMediaCallToActionsAppInstall:
      type: object
      properties:
        app_store_id:
          type: string
          description: Apple App Store iPhone app id.
        ipad_app_store_id:
          type: string
          description: Apple App Store iPad app id.
        play_store_id:
          type: string
          description: Google Play Store app id.
      additionalProperties: false
    CreatePostsMediaCallToActionsVisitSite:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: HTTPS URL the CTA links to.
      additionalProperties: false
    CreatePostsMediaCallToActionsWatchNow:
      type: object
      required:
        - url
      properties:
        url:
          type: string
          description: HTTPS URL the CTA links to.
      additionalProperties: false
  securitySchemes:
    OAuth2UserToken:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://api.x.com/2/oauth2/authorize
          tokenUrl: https://api.x.com/2/oauth2/token
          scopes:
            block.read: View accounts you have blocked.
            block.write: Block and unblock accounts on your behalf.
            bookmark.read: Read your bookmarked Posts.
            bookmark.write: Create and delete your bookmarks.
            broadcast.read: View your live broadcasts and their chat.
            broadcast.write: Manage your live broadcasts and send chat messages on your behalf.
            developer.read: View your developer accounts, apps, and settings.
            developer.write: Create and manage your X Developer Platform account.
            dm.read: Read all your Direct Messages.
            dm.write: Send and manage your Direct Messages.
            follows.read: View accounts you follow and accounts following you.
            follows.write: Follow and unfollow accounts on your behalf.
            like.read: View Posts you have liked and likes you can see.
            like.write: Like and unlike Posts on your behalf.
            list.read: >-
              View Lists, members, and followers of Lists you created or are a
              member of, including private Lists.
            list.write: Create and manage Lists on your behalf.
            media.write: Upload media, such as photos and videos, on your behalf.
            mute.read: View accounts you have muted.
            mute.write: Mute and unmute accounts on your behalf.
            offline.access: Request a refresh token for the app.
            space.read: View all Spaces you have access to.
            timeline.read: View all Custom Timelines you can see.
            tweet.moderate.write: Hide and unhide replies to your posts.
            tweet.read: >-
              View all posts you can see, including those from protected
              accounts.
            tweet.write: Create and repost on your behalf.
            users.read: View any account you can see, including protected accounts.
    UserToken:
      type: http
      scheme: OAuth

````