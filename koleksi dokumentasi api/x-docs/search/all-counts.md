> This page location: X Developer Platform > x-api/posts/get-count-of-all-posts
> Full documentation index: https://docs.x.com/llms.txt
> Source: https://docs.x.com/x-api/posts/get-count-of-all-posts.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Posts Counts All

> At most one of `pagination_token`, `next_token` may be provided.



## OpenAPI

````yaml get /2/tweets/counts/all
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
  /2/tweets/counts/all:
    get:
      tags:
        - Posts
      summary: Get Posts Counts All
      description: At most one of `pagination_token`, `next_token` may be provided.
      operationId: getPostsCountsAll
      parameters:
        - name: query
          in: query
          required: true
          schema:
            type: string
            minLength: 1
            maxLength: 4096
          style: form
        - name: start_time
          in: query
          required: false
          schema:
            type: string
            format: date-time
          style: form
        - name: end_time
          in: query
          required: false
          schema:
            type: string
            format: date-time
          style: form
        - name: since_id
          in: query
          required: false
          schema:
            type: string
            pattern: ^[0-9]{1,19}$
          style: form
        - name: until_id
          in: query
          required: false
          schema:
            type: string
            pattern: ^[0-9]{1,19}$
          style: form
        - name: next_token
          in: query
          description: A base32hex-encoded pagination token.
          required: false
          schema:
            type: string
            minLength: 1
          style: form
        - name: pagination_token
          in: query
          description: A base32hex-encoded pagination token.
          required: false
          schema:
            type: string
            minLength: 1
          style: form
        - name: granularity
          in: query
          required: false
          schema:
            type: string
            enum:
              - minute
              - hour
              - day
            default: hour
          style: form
        - name: search_count.fields
          in: query
          required: false
          schema:
            type: string
          style: form
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetPostsCountsAllResponse'
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
        - BearerToken: []
components:
  schemas:
    GetPostsCountsAllResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/GetPostsCountsAllResponseData'
        errors:
          type: array
          items:
            $ref: '#/components/schemas/Problem'
        meta:
          type: object
          properties:
            next_token:
              type: string
              description: Pagination token for the next page of results.
            total_post_count:
              type: integer
              format: int64
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
    GetPostsCountsAllResponseData:
      type: object
      required:
        - start
        - end
        - post_count
      properties:
        end:
          type: string
          description: End of the count bucket (exclusive), RFC 3339.
        post_count:
          type: integer
          description: Number of Posts in the bucket.
        start:
          type: string
          description: Start of the count bucket (inclusive), RFC 3339.
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
    BearerToken:
      type: http
      scheme: bearer

````