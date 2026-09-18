> This page location: X Developer Platform > x-api/media/append-media-upload
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/x-api/media/append-media-upload.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Append Media Upload



## OpenAPI

````yaml post /2/media/upload/{id}/append
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
  /2/media/upload/{id}/append:
    post:
      tags:
        - Media
      summary: Append Media Upload
      operationId: appendMediaUpload
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            pattern: ^[0-9]{1,19}$
          style: simple
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppendMediaUploadRequest'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/AppendMediaUploadRequest'
        required: true
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppendMediaUploadResponse'
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
            - media.write
        - UserToken: []
components:
  schemas:
    AppendMediaUploadRequest:
      type: object
      required:
        - media
        - segment_index
      properties:
        media:
          anyOf:
            - type: string
              format: binary
            - type: string
              format: byte
          description: The media chunk to upload.
        segment_index:
          type: integer
          description: The index of this segment in the upload sequence.
          minimum: 0
          maximum: 999
      additionalProperties: false
    AppendMediaUploadResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/AppendMediaUploadResponseData'
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
    AppendMediaUploadResponseData:
      type: object
      properties:
        expires_at:
          type: integer
          description: Epoch seconds when the upload session expires.
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