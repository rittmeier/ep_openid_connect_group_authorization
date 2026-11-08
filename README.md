# ep_openid_connect_group_authorization

Group-based authorization for Etherpad using OpenID Connect.

This plugin extends [ep_openid_connect](https://www.npmjs.com/package/ep_openid_connect)
with authorization based on group membership provided by an OpenID Connect
identity provider.

It is particularly useful when multiple Etherpad instances share a central
identity provider, but each instance should only be accessible to members
of specific groups.

## Requirements

- Etherpad 3.x (tested with 3.3.15)
- ep_openid_connect (tested with 3.0.52)
- An OpenID Connect provider that provides group membership through UserInfo

## Installation

Install both plugins from your Etherpad installation:

    pnpm run plugins install ep_openid_connect
    pnpm run plugins install ep_openid_connect_group_authorization

## Configuration

Configure ep_openid_connect according to its documentation.

Then add the following settings to Etherpad's settings.json:

    {
      "requireAuthentication": true,
      "requireAuthorization": true,
      "ep_openid_connect_group_authorization": {
        "allowed_groups": ["editors"]
      }
    }

The identity provider must provide a groups array in the UserInfo
data received by ep_openid_connect.

Example UserInfo:

    {
      "email": "user@example.org",
      "groups": ["editors", "project-team"]
    }

A user is authorized if at least one of their groups matches an entry
in allowed_groups.

Multiple groups can be configured:

    {
      "ep_openid_connect_group_authorization": {
        "allowed_groups": ["editors", "project-team"]
      }
    }

Users without a matching group are denied access.

If allowed_groups is empty or missing, or the identity provider does
not provide a valid groups array, authorization is denied.

Group names are matched exactly and are case-sensitive.

## Keycloak example

Keycloak can provide group membership through an OpenID Connect protocol
mapper. The following example uses Keycloak 26.x.

### Create a client scope

1. Open the Keycloak Admin Console and select your realm.
2. Navigate to Client scopes and select Create client scope.
3. Enter a name such as `etherpad-groups`.
4. Select OpenID Connect as the protocol and Default as the type.
5. Save the client scope.

### Configure the group mapper

1. Open the new client scope and select the Mappers tab.
2. Select Configure a new mapper (or Add mapper -> By configuration
   if mappers already exist).
3. Select Group Membership.
4. Configure the mapper:

   - Name: groups
   - Token Claim Name: groups
   - Full group path: Off
   - Add to userinfo: On

5. Save the mapper.

With Full group path disabled, a user belonging to the groups
"editors" and "project-team" should have the following UserInfo claim:

    "groups": ["editors", "project-team"]

If Full group path is enabled, Keycloak returns group paths such as
"/editors". Configure allowed_groups accordingly.

### Assign the client scope

For each Etherpad client:

1. Navigate to Clients and select the Etherpad client.
2. Open the Client scopes tab.
3. Select Add client scope.
4. Choose the new `etherpad-groups` scope.
5. Add it as Default.

The groups claim will now be included in UserInfo without requiring
the Etherpad client to request an additional optional scope.

### Verify the configuration

1. Open Clients -> your Etherpad client -> Client scopes.
2. Select Evaluate.
3. Select a test user who belongs to one or more groups.
4. Inspect Generated user info.

Verify that the groups array contains the expected group names.

The groups claim must be present in UserInfo, not only in the ID token
or access token, because this plugin reads the UserInfo data stored
by ep_openid_connect.

## Session behavior

Group membership is evaluated using the user information stored in the
Etherpad session by ep_openid_connect.

Changes to group membership at the identity provider are not necessarily
reflected immediately in existing sessions. They generally take effect
when the session's user information is refreshed or a new authenticated
session is established.

Access-token expiration or revocation does not necessarily invalidate
an existing Etherpad session.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
