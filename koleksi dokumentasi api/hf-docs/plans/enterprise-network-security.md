# Network Security

> [!WARNING]
> This feature is part of the Enterprise Plus plan.

## Define your organization IP Ranges

You can list the IP addresses of your organization's outbound traffic to enforce authenticated access to Hugging Face from your corporate network.
The outbound IP address ranges are defined in CIDR format. For example, `52.219.168.0/24` or `2600:1f69:7400::/40`.

You can set multiple ranges, one per line. 

Once organization admins populate the “Organization IP Ranges” in the Network Security settings, a manual verification—carried out jointly by Hugging Face Solution Engineers and the organization’s admins—is required for the "Require login for users in your IP ranges" setting to become available.

After the “Organization IP Ranges” have been manually verified, and the organization admins have enabled both “Restrict organization access to your IP ranges only” and “Require login for users in your IP ranges”, the following flow applies:
- When a user arrives on the platform, their IP address is checked.
- If the IP falls within the organization’s defined ranges, the user must authenticate (via the organization’s SSO if enabled).
- Once authenticated, the Content Access Policy determines which resources the user can access.

## Higher Hub Rate Limits

Most of the actions on the Hub have limits; for example, users are limited to creating a certain number of repositories per day. Enterprise Plus automatically gives your users high rate limits for every action.

Additionally, enabling the "Higher Hub Rate Limits" option allows your organization to benefit from the highest HTTP rate limits on the Hub API, unlocking large volumes of model or dataset downloads.

For more information about rate limits, see the [Hub Rate limits](./rate-limits) documentation.

## Restrict organization access to your IP ranges only

This option restricts access to your organization's resources to only those coming from your defined IP ranges. No one can access your organization resources outside your IP ranges. The rules also apply to access tokens. When enabled, this option unlocks additional nested security settings below.

> [!TIP]
> For automated workflows that run outside your corporate network, you can exempt an individual [service account token](./enterprise-service-accounts#network-security-exemption) from these restrictions and from the Content Access Policy.

### Require login for users in your IP ranges

When this option is enabled, anyone visiting Hugging Face from your corporate network must be logged in and belong to your organization (requires a manual verification when IP ranges have changed). If enabled, you can optionally define a content access policy.

All public pages will show the following message if access is unauthenticated:

### Content Access Policy 

Define a fine-grained Content Access Policy by blocking specific content of the Hugging Face Hub. 

For example, you can block your organization's members from accessing Spaces. When users of your organization navigate to blocked content, they'll be presented the following page:

To define Blocked content, add rules that target a repository type, an organization, a specific repository, or a combination such as a repository type within a given organization (e.g. all Spaces from a specific organization).

The Always allowed field lets you define exceptions to the blocking rules. You can target content that should remain accessible even when a block rule would otherwise apply.

#### Keep repository metadata visible

By default, when a repository is blocked by the Content Access Policy, the whole repository becomes inaccessible. Enable the "Keep repository metadata visible" option to only block a repository's content while keeping its metadata visible.

When this option is enabled, blocked repositories still show their metadata (repo card, profile and listing pages), and only their content is blocked: file downloads, the dataset viewer, running Spaces and model inference.

## Manage Network Security via API

You can read and update your organization's network security settings programmatically via the Hub API.

**OpenAPI reference:**
- GET /api/organizations//settings/network-security
- PATCH /api/organizations//settings/network-security

