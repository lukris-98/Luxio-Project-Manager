> This page location: X Developer Platform > x-api/users/get-users-by-usernames
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/x-api/users/get-users-by-usernames.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Users by Usernames



## OpenAPI

````yaml get /2/users/by
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
  /2/users/by:
    get:
      tags:
        - Users
      summary: Get Users by Usernames
      operationId: getUsersByUsernames
      parameters:
        - name: usernames
          in: query
          required: true
          schema:
            type: array
            minItems: 1
            maxItems: 100
            items:
              type: string
              pattern: ^[A-Za-z0-9_]{1,15}$
          explode: false
          style: form
        - $ref: '#/components/parameters/UserFieldsParameter'
        - $ref: '#/components/parameters/UserExpansionsParameter'
        - $ref: '#/components/parameters/PostFieldsParameter'
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetUsersByUsernamesResponse'
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
        - UserToken: []
        - BearerToken: []
components:
  parameters:
    UserFieldsParameter:
      name: user.fields
      in: query
      description: A comma separated list of User fields to display.
      required: false
      schema:
        type: array
        description: The fields available for a User object.
        minItems: 1
        uniqueItems: true
        items:
          type: string
          enum:
            - confirmed_email
            - connection_status
            - created_at
            - description
            - entities
            - id
            - is_identity_verified
            - location
            - name
            - parody
            - profile_banner_url
            - profile_image_url
            - protected
            - public_metrics
            - receives_your_dm
            - subscriber_count
            - subscribes_to_you
            - subscription
            - subscription_type
            - url
            - username
            - verified
            - verified_followers_count
            - verified_type
            - withheld
      explode: false
      style: form
    UserExpansionsParameter:
      name: expansions
      in: query
      description: A comma separated list of fields to expand.
      required: false
      schema:
        type: array
        minItems: 1
        uniqueItems: true
        items:
          type: string
          enum:
            - affiliation
            - most_recent_post_id
            - pinned_post_id
      explode: false
      style: form
    PostFieldsParameter:
      name: post.fields
      in: query
      description: A comma separated list of Post fields to display.
      required: false
      schema:
        type: array
        description: The fields available for a Post object.
        minItems: 1
        uniqueItems: true
        items:
          type: string
          enum:
            - article
            - article_title
            - attachments
            - card_uri
            - community_id
            - context_annotations
            - conversation_id
            - created_at
            - display_text_range
            - edit_controls
            - entities
            - geo
            - id
            - lang
            - matched_media_notes
            - media_metadata
            - non_public_metrics
            - note_post
            - note_request_suggestions
            - organic_metrics
            - paid_partnership
            - possibly_sensitive
            - promoted_metrics
            - public_metrics
            - reply_settings
            - scopes
            - source
            - suggested_source_links
            - suggested_source_links_with_counts
            - text
            - withheld
      explode: false
      style: form
  schemas:
    GetUsersByUsernamesResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        errors:
          type: array
          items:
            $ref: '#/components/schemas/Problem'
        includes:
          $ref: '#/components/schemas/Expansions'
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
    User:
      type: object
      properties:
        affiliation:
          $ref: '#/components/schemas/UserAffiliation'
        confirmed_email:
          type: string
        connection_status:
          $ref: '#/components/schemas/UserConnectionStatus'
        created_at:
          type: string
          description: Creation time of this User.
          format: date-time
        description:
          type: string
          description: >-
            The text of this User's profile description (also known as bio), if
            the User provided one.
        entities:
          $ref: '#/components/schemas/UserEntities'
        id:
          type: string
          description: Unique identifier of this User.
        is_identity_verified:
          type: boolean
          description: Indicates if this User has completed identity verification.
        location:
          type: string
          description: >-
            The location specified in the User's profile, if the User provided
            one. As this is a freeform value, it may not indicate a valid
            location.
        most_recent_post_id:
          type: string
          description: Unique identifier of this User's most recent Post.
        name:
          type: string
          description: The friendly name of this User, as shown on their profile.
        parody:
          type: boolean
          description: Indicates if this User is a parody account.
        pinned_post_id:
          type: string
          description: Unique identifier of this User's pinned Post.
        profile_banner_url:
          type: string
          description: The URL to the profile banner for this User.
        profile_image_url:
          type: string
          description: The URL to the profile image for this User.
        protected:
          type: boolean
          description: >-
            Indicates if this User has chosen to protect their Posts (in other
            words, if this User's Posts are private).
        public_metrics:
          $ref: '#/components/schemas/UserPublicMetrics'
        receives_your_dm:
          type: boolean
          description: Indicates if you can send a DM to this User.
        subscriber_count:
          type: integer
          description: The number of Premium subscribers of this User.
        subscribes_to_you:
          type: boolean
          description: Indicates if this User subscribes to you.
        subscription:
          $ref: '#/components/schemas/UserSubscription'
        subscription_type:
          type: string
          description: >-
            The X Blue subscription type of the user, e.g.: Basic, Premium,
            PremiumPlus or None.
        url:
          type: string
          description: The URL specified in the User's profile.
        username:
          type: string
          description: The X handle (screen name) of this User.
        verified:
          type: boolean
          description: Indicates if this User is a verified X User.
        verified_followers_count:
          type: integer
          description: The number of verified followers of this User.
        verified_type:
          type: string
          description: >-
            The X Blue verified type of the user, e.g.: blue, government,
            business or none.
        withheld:
          $ref: '#/components/schemas/UserWithheld'
    Expansions:
      type: object
      properties:
        media:
          type: array
          items:
            $ref: '#/components/schemas/Media'
        places:
          type: array
          items:
            $ref: '#/components/schemas/Place'
        polls:
          type: array
          items:
            $ref: '#/components/schemas/Poll'
        posts:
          type: array
          items:
            $ref: '#/components/schemas/Post'
        topics:
          type: array
          items:
            $ref: '#/components/schemas/Topic'
        users:
          type: array
          items:
            $ref: '#/components/schemas/User'
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
    UserAffiliation:
      type: object
      description: Metadata about a user's affiliation.
      properties:
        badge_url:
          type: string
          description: URL of the affiliation badge image shown on the User's profile.
          nullable: true
        description:
          type: string
          description: Description of the affiliation.
          nullable: true
        url:
          type: string
          description: URL associated with the affiliation.
          nullable: true
        user_id:
          type: array
          description: >-
            A list of unique identifiers of the accounts this User is affiliated
            with.
          items:
            type: string
          nullable: true
    UserConnectionStatus:
      type: array
      description: Returns detailed information about the relationship between two users.
      items:
        type: string
        description: A connection between the authenticated User and this User.
        enum:
          - blocking
          - follow_request_received
          - follow_request_sent
          - followed_by
          - following
          - muting
    UserEntities:
      type: object
      description: A list of metadata found in the User's profile description.
      properties:
        description:
          type: object
          description: Entities found in the User's bio.
          properties:
            cashtags:
              type: array
              items:
                type: object
                description: A hashtag or cashtag entity.
                required:
                  - start
                  - end
                  - tag
                properties:
                  end:
                    type: integer
                    description: End index in the text (exclusive).
                    format: int64
                  start:
                    type: integer
                    description: Start index in the text (inclusive).
                    format: int64
                  tag:
                    type: string
              nullable: true
            hashtags:
              type: array
              items:
                type: object
                description: A hashtag or cashtag entity.
                required:
                  - start
                  - end
                  - tag
                properties:
                  end:
                    type: integer
                    description: End index in the text (exclusive).
                    format: int64
                  start:
                    type: integer
                    description: Start index in the text (inclusive).
                    format: int64
                  tag:
                    type: string
              nullable: true
            mentions:
              type: array
              items:
                type: object
                description: A user mention entity.
                required:
                  - start
                  - end
                  - username
                properties:
                  end:
                    type: integer
                    format: int64
                  id:
                    type: string
                    nullable: true
                  start:
                    type: integer
                    format: int64
                  username:
                    type: string
              nullable: true
            urls:
              type: array
              items:
                type: object
                description: A URL entity found in profile text.
                required:
                  - start
                  - end
                  - url
                properties:
                  description:
                    type: string
                    description: Description of the linked page, when available.
                    nullable: true
                  display_url:
                    type: string
                    description: The URL as displayed in the Post text.
                    nullable: true
                  end:
                    type: integer
                    format: int64
                  expanded_url:
                    type: string
                    description: The fully resolved URL.
                    nullable: true
                  images:
                    type: array
                    items:
                      type: object
                      description: A preview image for a linked page.
                      properties:
                        height:
                          type: integer
                          format: int64
                          nullable: true
                        url:
                          type: string
                          nullable: true
                        width:
                          type: integer
                          format: int64
                          nullable: true
                    nullable: true
                  media_key:
                    type: string
                    nullable: true
                  start:
                    type: integer
                    format: int64
                  status:
                    type: integer
                    description: HTTP status from resolving the URL.
                    format: int64
                    nullable: true
                  title:
                    type: string
                    description: Title of the linked page, when available.
                    nullable: true
                  unwound_url:
                    type: string
                    description: The final destination after following redirects.
                    nullable: true
                  url:
                    type: string
                    description: The t.co shortened URL.
              nullable: true
          nullable: true
        url:
          type: object
          description: Entities for the User's profile website URL.
          properties:
            urls:
              type: array
              items:
                type: object
                description: A URL entity found in profile text.
                required:
                  - start
                  - end
                  - url
                properties:
                  description:
                    type: string
                    description: Description of the linked page, when available.
                    nullable: true
                  display_url:
                    type: string
                    description: The URL as displayed in the Post text.
                    nullable: true
                  end:
                    type: integer
                    format: int64
                  expanded_url:
                    type: string
                    description: The fully resolved URL.
                    nullable: true
                  images:
                    type: array
                    items:
                      type: object
                      description: A preview image for a linked page.
                      properties:
                        height:
                          type: integer
                          format: int64
                          nullable: true
                        url:
                          type: string
                          nullable: true
                        width:
                          type: integer
                          format: int64
                          nullable: true
                    nullable: true
                  media_key:
                    type: string
                    nullable: true
                  start:
                    type: integer
                    format: int64
                  status:
                    type: integer
                    description: HTTP status from resolving the URL.
                    format: int64
                    nullable: true
                  title:
                    type: string
                    description: Title of the linked page, when available.
                    nullable: true
                  unwound_url:
                    type: string
                    description: The final destination after following redirects.
                    nullable: true
                  url:
                    type: string
                    description: The t.co shortened URL.
              nullable: true
          nullable: true
    UserPublicMetrics:
      type: object
      description: A list of metrics for this User.
      required:
        - followers_count
        - following_count
        - post_count
        - listed_count
      properties:
        followers_count:
          type: integer
          description: Number of Users who follow this User.
          format: int64
        following_count:
          type: integer
          description: Number of Users this User follows.
          format: int64
        like_count:
          type: integer
          description: Number of Posts this User has liked.
          format: int64
          nullable: true
        listed_count:
          type: integer
          description: Number of Lists that include this User.
          format: int64
        media_count:
          type: integer
          description: Number of media items posted by this User.
          format: int64
          nullable: true
        post_count:
          type: integer
          description: Number of Posts (including Reposts) created by this User.
          format: int64
    UserSubscription:
      type: object
      description: The subscription relationship between this User and you.
      required:
        - subscribes_to_you
      properties:
        subscribes_to_you:
          type: boolean
          description: Indicates if this User subscribes to you.
    UserWithheld:
      type: object
      description: Withholding details for withheld content.
      properties:
        country_codes:
          type: array
          description: >-
            A list of countries (as ISO 3166-1 alpha-2 codes) where this content
            is withheld.
          items:
            type: string
          nullable: true
        scope:
          type: string
          description: >-
            The scope of the withholding. Only present, with the value "user",
            when the entire User is withheld.
          enum:
            - user
          nullable: true
    Media:
      type: object
      properties:
        alt_text:
          type: string
        duration_ms:
          type: integer
        height:
          type: integer
        media_key:
          type: string
        non_public_metrics:
          $ref: '#/components/schemas/MediaNonPublicMetrics'
        organic_metrics:
          $ref: '#/components/schemas/MediaOrganicMetrics'
        preview_image_url:
          type: string
        promoted_metrics:
          $ref: '#/components/schemas/MediaPromotedMetrics'
        public_metrics:
          $ref: '#/components/schemas/MediaPublicMetrics'
        type:
          type: string
        url:
          type: string
        variants:
          $ref: '#/components/schemas/MediaVariants'
        width:
          type: integer
    Place:
      type: object
      properties:
        contained_within:
          $ref: '#/components/schemas/PlaceContainedWithin'
        country:
          type: string
        country_code:
          type: string
        full_name:
          type: string
        geo:
          $ref: '#/components/schemas/PlaceGeo'
        id:
          type: string
        name:
          type: string
        place_type:
          type: string
    Poll:
      type: object
      properties:
        duration_minutes:
          type: integer
        end_datetime:
          type: string
        id:
          type: string
        options:
          $ref: '#/components/schemas/PollOptions'
        voting_status:
          type: string
    Post:
      type: object
      properties:
        article:
          type: object
        article_title:
          type: object
          description: Metadata about the long-form Article attached to this Post, if any.
        attachments:
          $ref: '#/components/schemas/PostAttachments'
        author_id:
          type: string
          description: Unique identifier of the author of this Post.
        card_uri:
          type: string
        community_id:
          type: string
          description: The unique identifier of the Community this Post belongs to, if any.
        context_annotations:
          $ref: '#/components/schemas/PostContextAnnotations'
        conversation_id:
          type: string
          description: >-
            The ID of the conversation this Post belongs to (matches the root
            Post's ID).
        created_at:
          type: string
          description: Creation time of the Post.
          format: date-time
        display_text_range:
          $ref: '#/components/schemas/PostDisplayTextRange'
        edit_controls:
          $ref: '#/components/schemas/PostEditControls'
        edit_history_post_ids:
          type: array
          description: A list of Post IDs in this Post's edit history chain.
          items:
            type: string
        entities:
          $ref: '#/components/schemas/PostEntities'
        geo:
          $ref: '#/components/schemas/PostGeo'
        id:
          type: string
          description: Unique identifier of this Post.
        in_reply_to_user_id:
          type: string
          description: Unique identifier of the User this Post is replying to.
        lang:
          type: string
          description: >-
            Language of the Post, if detected by X. Returned as a BCP47 language
            tag.
        matched_media_notes:
          $ref: '#/components/schemas/PostMatchedMediaNotes'
        media_metadata:
          $ref: '#/components/schemas/PostMediaMetadata'
        non_public_metrics:
          type: object
          description: >-
            Nonpublic engagement metrics for the Post at the time of the
            request.
        note_post:
          $ref: '#/components/schemas/PostNotePost'
        note_request_suggestions:
          $ref: '#/components/schemas/PostNoteRequestSuggestions'
        organic_metrics:
          type: object
          description: >-
            Organic nonpublic engagement metrics for the Post at the time of the
            request.
        paid_partnership:
          type: boolean
          description: >-
            Indicates if this Post is a paid partnership, i.e. it has been
            disclosed by the author as containing paid promotion.
        possibly_sensitive:
          type: boolean
          description: >-
            Indicates if this Post contains URLs marked as sensitive, for
            example content suitable for mature audiences.
        promoted_metrics:
          type: object
          description: >-
            Promoted nonpublic engagement metrics for the Post at the time of
            the request.
        public_metrics:
          $ref: '#/components/schemas/PostPublicMetrics'
        referenced_posts:
          $ref: '#/components/schemas/PostReferencedPosts'
        reply_settings:
          type: string
          description: Shows who can reply to this Post.
        scopes:
          $ref: '#/components/schemas/PostScopes'
        source:
          type: string
          description: The name of the app the user posted from. This is deprecated.
        suggested_source_links:
          $ref: '#/components/schemas/PostSuggestedSourceLinks'
        suggested_source_links_with_counts:
          $ref: '#/components/schemas/PostSuggestedSourceLinksWithCounts'
        text:
          type: string
          description: The content of the Post.
        username:
          type: string
        withheld:
          $ref: '#/components/schemas/PostWithheld'
    Topic:
      type: object
      properties:
        description:
          type: string
        id:
          type: string
        name:
          type: string
    MediaNonPublicMetrics:
      type: object
      description: Nonpublic engagement metrics for the media at the time of the request.
      properties:
        playback_0_count:
          type: integer
          description: Number of users who started playback (0% quartile) of this video.
          format: int64
          nullable: true
        playback_100_count:
          type: integer
          description: >-
            Number of users who completed playback (100% quartile) of this
            video.
          format: int64
          nullable: true
        playback_25_count:
          type: integer
          description: Number of users who watched at least 25% of this video.
          format: int64
          nullable: true
        playback_50_count:
          type: integer
          description: Number of users who watched at least 50% of this video.
          format: int64
          nullable: true
        playback_75_count:
          type: integer
          description: Number of users who watched at least 75% of this video.
          format: int64
          nullable: true
    MediaOrganicMetrics:
      type: object
      description: >-
        Organic nonpublic engagement metrics for the media at the time of the
        request.
      properties:
        playback_0_count:
          type: integer
          description: Number of users who started playback (0% quartile) of this video.
          format: int64
          nullable: true
        playback_100_count:
          type: integer
          description: >-
            Number of users who completed playback (100% quartile) of this
            video.
          format: int64
          nullable: true
        playback_25_count:
          type: integer
          description: Number of users who watched at least 25% of this video.
          format: int64
          nullable: true
        playback_50_count:
          type: integer
          description: Number of users who watched at least 50% of this video.
          format: int64
          nullable: true
        playback_75_count:
          type: integer
          description: Number of users who watched at least 75% of this video.
          format: int64
          nullable: true
        view_count:
          type: integer
          description: >-
            The number of organic views of this video. Null when the backend
            returns quartile data without a view count.
          format: int64
          nullable: true
    MediaPromotedMetrics:
      type: object
      description: >-
        Promoted nonpublic engagement metrics for the media at the time of the
        request.
      properties:
        playback_0_count:
          type: integer
          description: Number of users who started playback (0% quartile) of this video.
          format: int64
          nullable: true
        playback_100_count:
          type: integer
          description: >-
            Number of users who completed playback (100% quartile) of this
            video.
          format: int64
          nullable: true
        playback_25_count:
          type: integer
          description: Number of users who watched at least 25% of this video.
          format: int64
          nullable: true
        playback_50_count:
          type: integer
          description: Number of users who watched at least 50% of this video.
          format: int64
          nullable: true
        playback_75_count:
          type: integer
          description: Number of users who watched at least 75% of this video.
          format: int64
          nullable: true
        view_count:
          type: integer
          description: >-
            The number of promoted views of this video. Null when the backend
            returns quartile data without a view count.
          format: int64
          nullable: true
    MediaPublicMetrics:
      type: object
      description: Public engagement metrics for the media at the time of the request.
      required:
        - view_count
      properties:
        view_count:
          type: integer
          description: The number of times this video has been viewed.
          format: int64
    MediaVariants:
      type: array
      description: >-
        Each media object may have multiple display or playback variants, with
        different resolutions or formats.
      items:
        type: object
        description: A single playback or display variant of a media object.
        properties:
          bit_rate:
            type: integer
            description: >-
              The bit rate of this variant, in bits per second. Absent for
              playlist variants.
            format: int64
            nullable: true
          content_type:
            type: string
            description: >-
              The MIME type of this variant, for example "video/mp4" or
              "application/x-mpegURL".
            nullable: true
          url:
            type: string
            description: The URL to this media variant.
            nullable: true
    PlaceContainedWithin:
      type: array
      description: A list of unique identifiers of the Places that contain this place.
      items:
        type: string
    PlaceGeo:
      type: object
      description: The geographic location of this place, expressed as a GeoJSON Feature.
      required:
        - type
        - bbox
        - properties
      properties:
        bbox:
          type: array
          description: >-
            The bounding box as [southwest_longitude, southwest_latitude,
            northeast_longitude, northeast_latitude].
          minItems: 4
          maxItems: 4
          items:
            type: number
            format: double
        properties:
          type: object
          description: Additional GeoJSON feature properties.
        type:
          description: The GeoJSON feature type.
          oneOf:
            - type: string
              enum:
                - Feature
    PollOptions:
      type: array
      description: The list of options (choices) available in this poll.
      items:
        type: object
        description: A single option (choice) available in a poll.
        required:
          - position
          - label
          - votes
        properties:
          label:
            type: string
            description: The text label of this poll option.
          position:
            type: integer
            description: The 1-based position of this option within the poll.
            format: int64
          votes:
            type: integer
            description: The number of votes this option has received.
            format: int64
    PostAttachments:
      type: object
      description: Specifies the type of attachments (if any) present in this Post.
      properties:
        media_keys:
          type: array
          description: Media keys of media attached to this Post.
          items:
            type: string
          nullable: true
        media_source_tweet_id:
          type: array
          description: IDs of the source Posts the attached media originated from.
          items:
            type: string
          nullable: true
        poll_ids:
          type: array
          description: IDs of polls attached to this Post.
          items:
            type: string
          nullable: true
    PostContextAnnotations:
      type: array
      description: Annotations inferred about the Post (domain and entity context).
      items:
        type: object
        description: >-
          A single inferred annotation about the Post (domain and entity
          context).
        required:
          - domain
          - entity
        properties:
          domain:
            description: The domain (broad category) this annotation belongs to.
            oneOf:
              - type: object
                description: A domain or entity referenced by a context annotation.
                properties:
                  description:
                    type: string
                    nullable: true
                  id:
                    type: string
                    nullable: true
                  name:
                    type: string
                    nullable: true
          entity:
            description: The specific entity recognized within the domain.
            oneOf:
              - type: object
                description: A domain or entity referenced by a context annotation.
                properties:
                  description:
                    type: string
                    nullable: true
                  id:
                    type: string
                    nullable: true
                  name:
                    type: string
                    nullable: true
    PostDisplayTextRange:
      type: array
      description: >-
        The inclusive start and exclusive end indices of the displayable content
        of the Post.
      minItems: 2
      maxItems: 2
      items:
        type: integer
        format: int64
    PostEditControls:
      type: object
      description: Indicates how much longer (if at all) this Post can be edited.
      properties:
        editable_until:
          type: string
          description: The time until which this Post can be edited.
          nullable: true
        edits_remaining:
          type: integer
          description: Number of edits still allowed for this Post.
          format: int64
          nullable: true
        is_edit_eligible:
          type: boolean
          description: Indicates whether this Post is eligible to be edited.
          nullable: true
    PostEntities:
      type: object
      description: >-
        A list of metadata entities (hashtags, mentions, URLs) found in the Post
        text.
      properties:
        cashtags:
          type: array
          items:
            type: object
            description: A hashtag or cashtag entity.
            required:
              - start
              - end
              - tag
            properties:
              end:
                type: integer
                description: End index in the text (exclusive).
                format: int64
              start:
                type: integer
                description: Start index in the text (inclusive).
                format: int64
              tag:
                type: string
          nullable: true
        hashtags:
          type: array
          items:
            type: object
            description: A hashtag or cashtag entity.
            required:
              - start
              - end
              - tag
            properties:
              end:
                type: integer
                description: End index in the text (exclusive).
                format: int64
              start:
                type: integer
                description: Start index in the text (inclusive).
                format: int64
              tag:
                type: string
          nullable: true
        mentions:
          type: array
          items:
            type: object
            description: A user mention entity.
            required:
              - start
              - end
            properties:
              end:
                type: integer
                format: int64
              id:
                type: string
                nullable: true
              start:
                type: integer
                format: int64
              username:
                type: string
                nullable: true
          nullable: true
        urls:
          type: array
          items:
            type: object
            description: A URL entity found in the Post text, enriched with link metadata.
            required:
              - start
              - end
            properties:
              description:
                type: string
                description: Description of the linked page, when available.
                nullable: true
              display_url:
                type: string
                description: The URL as displayed in the Post text.
                nullable: true
              end:
                type: integer
                format: int64
              expanded_url:
                type: string
                description: The fully resolved URL.
                nullable: true
              images:
                type: array
                items:
                  type: object
                  description: A preview image for a linked page.
                  properties:
                    height:
                      type: integer
                      format: int64
                      nullable: true
                    url:
                      type: string
                      nullable: true
                    width:
                      type: integer
                      format: int64
                      nullable: true
                nullable: true
              media_key:
                type: string
                nullable: true
              start:
                type: integer
                format: int64
              status:
                type: integer
                description: HTTP status from resolving the URL.
                format: int64
                nullable: true
              title:
                type: string
                description: Title of the linked page, when available.
                nullable: true
              unwound_url:
                type: string
                description: The final destination after following redirects.
                nullable: true
              url:
                type: string
                description: The t.co shortened URL.
                nullable: true
          nullable: true
    PostGeo:
      type: object
      description: The location tagged on the Post, if the user provided one.
      properties:
        coordinates:
          type: object
          description: A GeoJSON Point geometry.
          required:
            - type
            - coordinates
          properties:
            coordinates:
              type: array
              description: '[longitude, latitude].'
              minItems: 2
              maxItems: 2
              items:
                type: number
                format: double
            type:
              type: string
              description: The GeoJSON geometry type.
              enum:
                - Point
          nullable: true
        place_id:
          type: string
          description: The unique identifier of the tagged place.
          nullable: true
    PostMatchedMediaNotes:
      type: array
      description: Community-Notes media matches for this Post.
      items:
        type: object
        description: A Community-Notes media match for this Post.
        properties:
          match_status:
            type: string
            description: The status of the media note match.
            nullable: true
          note_id:
            type: string
            description: The matched note's unique identifier.
            nullable: true
    PostMediaMetadata:
      type: array
      description: Metadata for media attached to this Post.
      items:
        type: object
        description: Metadata for one media item attached to this Post.
        properties:
          alt_text:
            type: string
            description: Alternative text describing the media for accessibility.
            nullable: true
          description:
            type: string
            description: Description of the media.
            nullable: true
          media_key:
            type: string
            description: The unique identifier of the media.
            nullable: true
          title:
            type: string
            description: Title of the media.
            nullable: true
    PostNotePost:
      type: object
      description: The full content of the Post, including text beyond 280 characters.
      required:
        - text
      properties:
        entities:
          type: object
          description: >-
            Metadata entities (hashtags, cashtags, mentions, URLs) found in the
            note Post text.
          properties:
            cashtags:
              type: array
              items:
                type: object
                description: A hashtag or cashtag entity.
                required:
                  - start
                  - end
                  - tag
                properties:
                  end:
                    type: integer
                    description: End index in the text (exclusive).
                    format: int64
                  start:
                    type: integer
                    description: Start index in the text (inclusive).
                    format: int64
                  tag:
                    type: string
              nullable: true
            hashtags:
              type: array
              items:
                type: object
                description: A hashtag or cashtag entity.
                required:
                  - start
                  - end
                  - tag
                properties:
                  end:
                    type: integer
                    description: End index in the text (exclusive).
                    format: int64
                  start:
                    type: integer
                    description: Start index in the text (inclusive).
                    format: int64
                  tag:
                    type: string
              nullable: true
            mentions:
              type: array
              items:
                type: object
                description: A user mention entity.
                required:
                  - start
                  - end
                properties:
                  end:
                    type: integer
                    format: int64
                  id:
                    type: string
                    nullable: true
                  start:
                    type: integer
                    format: int64
                  username:
                    type: string
                    nullable: true
              nullable: true
            urls:
              type: array
              items:
                type: object
                description: A URL entity found in note Post text.
                required:
                  - start
                  - end
                properties:
                  display_url:
                    type: string
                    nullable: true
                  end:
                    type: integer
                    format: int64
                  expanded_url:
                    type: string
                    nullable: true
                  start:
                    type: integer
                    format: int64
                  url:
                    type: string
                    nullable: true
              nullable: true
          nullable: true
        text:
          type: string
          description: The full note text of the Post.
    PostNoteRequestSuggestions:
      type: array
      description: Community-Notes request suggestions for this Post.
      items:
        type: object
        description: A Community-Notes request suggestion for this Post.
        properties:
          source_link:
            type: string
            description: A suggested source link supporting the note request.
            nullable: true
          suggestion:
            type: string
            description: The text of the note request suggestion.
            nullable: true
          suggestion_id:
            type: string
            description: The unique identifier of the note request suggestion.
            nullable: true
    PostPublicMetrics:
      type: object
      description: Engagement metrics for the Post at the time of the request.
      required:
        - repost_count
        - reply_count
        - like_count
        - quote_count
        - bookmark_count
        - impression_count
      properties:
        bookmark_count:
          type: integer
          description: Number of times this Post has been bookmarked.
          format: int64
        impression_count:
          type: integer
          description: Number of times this Post has been viewed.
          format: int64
        like_count:
          type: integer
          description: Number of likes on this Post.
          format: int64
        quote_count:
          type: integer
          description: Number of quote Posts of this Post.
          format: int64
        reply_count:
          type: integer
          description: Number of replies to this Post.
          format: int64
        repost_count:
          type: integer
          description: Number of times this Post has been reposted.
          format: int64
    PostReferencedPosts:
      type: array
      description: >-
        A list of Posts this Post refers to. If the Post is a Retweet, Quote or
        Reply, it includes the referenced Post's type and ID.
      items:
        type: object
        description: A reference from this Post to another Post (repost, quote, or reply).
        required:
          - type
          - id
        properties:
          id:
            type: string
            description: Unique identifier of the referenced Post.
          type:
            description: How this Post references the other Post.
            oneOf:
              - type: string
                description: The kind of Post-to-Post reference.
                enum:
                  - retweeted
                  - quoted
                  - replied_to
    PostScopes:
      type: object
      description: The scopes for this Post.
      required:
        - followers
      properties:
        followers:
          type: boolean
          description: >-
            Indicates whether visibility of this Post is limited to the author's
            followers.
    PostSuggestedSourceLinks:
      type: array
      description: URLs suggested as sources for this Post.
      items:
        type: string
    PostSuggestedSourceLinksWithCounts:
      type: array
      description: >-
        Suggested source URLs for this Post, each with the number of times it
        was suggested.
      items:
        type: object
        description: >-
          A suggested source URL for this Post with the number of times it was
          suggested.
        properties:
          count:
            type: integer
            description: Number of times this source link was suggested.
            format: int64
            nullable: true
          url:
            type: string
            description: The suggested source URL.
            nullable: true
    PostWithheld:
      type: object
      description: Withholding details for withheld content.
      required:
        - copyright
        - country_codes
      properties:
        copyright:
          type: boolean
          description: Indicates whether this content is withheld due to a copyright claim.
        country_codes:
          type: array
          description: >-
            Uppercase ISO 3166-1 alpha-2 country codes where this content is
            withheld.
          items:
            type: string
        scope:
          type: string
          description: Whether the withholding applies to a Post or a User.
          enum:
            - post
            - user
          nullable: true
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
    BearerToken:
      type: http
      scheme: bearer

````