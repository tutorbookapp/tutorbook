# Data Models

This directory contains all of the data models used throughout the app and
back-end (i.e. in our serverless functions).

That's one of the distinct advantages of using Next.js and Typescript for both
front-end and back-end; we can define one set of data models and use them
everywhere.

**Note:** This `README` does not contain up-to-date definitions for all the
classes, types, enums, and interfaces within this directory. If you're looking
for those, just look at the code. The purpose of this `README` is to provide a
high-level overview of the data flow within our app and to foster good [README
driven development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html).

## Organizations

Read [this RFC](https://github.com/tutorbookapp/tutorbook/issues/75) before
continuing.

### `Account`

The `Account` object is the base for both the `User` and the `Org` objects.
Because of this, we can have one `AccountProvider` for both organizations and
users.

An `Account` is defined as follows:

| Property | Type     | Description                             |
| -------- | -------- | --------------------------------------- |
| `name`   | `string` | The name of the org or user.            |
| `photo`  | `string` | The URL of the account's profile photo. |
| `email`  | `string` | The org's or user's email address.      |
| `phone`  | `string` | The org's or user's phone number.       |
| `bio`    | `string` | The org's or user's bio ("About me").   |

Behind the scenes, the `AccountProvider` depends on the
`firebase.auth.currentUser` to fetch account data from the `api/account` API
endpoint **but** it exposes only the `User` or `Org` data to it's consumers.

The `api/account` REST API endpoint returns **both** user account data (i.e. the
signed-in `User` object) _and_ the account data of any organizations that the
user belongs to.

We store the last used account as a session cookie (i.e. so that the signed-in
user doesn't have to switch to an org account for every session).

The value of the `AccountProvider` is controlled by the profile drop-down menu
(included in our `Header` component). That drop-down menu enables the signed-in
user to switch between their personal account and any org accounts to which they
have access.

Our UI/UX changes based on the value of the `AccountProvider` (i.e. most of our
UI/UX is a consumer of the `AccountContext`).

### `User`

The `User` object extends the `Account` object and contains some additional
properties (that relate to organization data flow):

| Property        | Type             | Description                                                                                                              |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `orgs`          | `string[]`       | An array of `Org` ids specifying the organizations to which the user belongs.                                            |
| `verifications` | `Verification[]` | An array of `Verification`s specifying the organizations that have vetted and taken on liability for the user's actions. |

**Note:** These are not _all_ of the properties added to `Account` by `User`.
These are merely the properties that are relevant to [organization data
flow](https://github.com/tutorbookapp/tutorbook/issues/75).

### `Verification`

Each `Verification` object contains:

| Property | Type      | Description                                                                               |
| -------- | --------- | ----------------------------------------------------------------------------------------- |
| `org`    | `string`  | The ID of the org that endorses (and takes on liability for) the verification.            |
| `user`   | `string`  | The ID of the user that ran the verification.                                             |
| `notes`  | `string`  | Any notes about the verification (e.g. "I did X and found Y").                            |
| `checks` | `Check[]` | An array of the checks performed (e.g. a DBS check, a verified university email address). |

### `Org`

Each `Org` object contains a `members` field that specifies all the users that
belong to it (via an array of `User` ids).
