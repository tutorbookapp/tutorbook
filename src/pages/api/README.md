# API

We use [serverless Next.js API
functions](https://nextjs.org/docs/api-routes/introduction) deployed on
[Vercel](https://vercel.com) to power most of our back-end work:

1. Creating new user accounts and updating existing user accounts when the
   [for students1](https://tutorbook.org/pupils) or [for
   volunteers](https://tutorbook.org/tutors) are submitted.
2. Signing users in via [custom Firebase Authentication
   tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
   (also when a user fills out a sign-up form).
3. Scheduling tutoring appointments (e.g. creating lesson requests, sending an
   approval email to get parental consent, creating Bramble rooms, sending the
   appointment emails, and creating Firestore NoSQL Database records).

Each of these API functions catches all known errors and sends them back to the
client in plain English (i.e. you can display `res.data` to the user when you
receive a `400` or `500` HTTP error code).

## Objects

Included below are the impromptu reference of the objects referred to in our
REST API specs (impromptu because they're already all defined as interfaces in
the [`@tutorbook/model`](https://github.com/tutorbookapp/covid-tutoring/tree/master/src/model/lib/)
package; the interfaces defined there are **ground truth** and will always be
up-to-date):

### `Attendee`

The `Attendee` object represents a user attending a tutoring appointment.

| Property | Type       | Description                                                                                             |
| -------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `roles`  | `string[]` | An array of the roles (i.e. `tutor` or `pupil`) that the attendee will play during the tutoring lesson. |
| `id`     | `string`   | The user's Firebase Authentication uID (i.e. also the ID of their Firestore profile document).          |

### `Timeslot`

The `Timeslot` object represents a window of time (in which a tutoring
appointment will take place).

| Property | Type                  | Description        |
| -------- | --------------------- | ------------------ |
| `from`   | `Date` or `Timestamp` | The starting time. |
| `to`     | `Date` or `Timestamp` | The ending time.   |

## REST API

Included below are the specifications of our REST API endpoints (accessible from
`https://tutorbook.org/api/{functionName}`).

Note that this are listed in the order that they will be called by a new user:

1. The user will create and login to their account by calling `/api/user`.
2. The user will send a lesson request by calling `/api/request`.
3. The user's parent will approve that lesson request by calling `/api/approve`
   via a CTA in the "Your son scheduled a lesson on Tutorbook!" email.

### `user`

The `/api/user` endpoint creates a new Firebase Authentication user and
Firestore profile document for that user (in the `/partitions/default/users`
collection).

#### Parameters

The following parameters should be sent in the HTTP request body.

| Parameter | Type     | Description                                                                        |
| --------- | -------- | ---------------------------------------------------------------------------------- |
| `user`    | `User`   | The user to create (i.e. output of one of the two sign-up forms).                  |
| `parents` | `User[]` | The user's parents (i.e. output of the "parent" fields in the pupil sign-up form). |

#### Actions

Upon request, the `/api/user` serverless API function:

1. Creates and signs-in a new Firebase Authentication user.
2. (Optional) Creates a new Firesbase Authentication user for the parents.
3. (Optional) Creates a new Firestore profile document for the parents.
4. Creates a new Firestore profile document for the given user.
5. Sends an email verification link to the new user (and his/her parents).

Note that this endpoint **will still function** if a user with the given email
already exists. If that is the case, we'll just update that user's info to match
the newly given info and respond with a login token as normal.

#### Response

A custom Firebase Authentication login token (that can be used to log the user
into Firebase client-side; a requirement to retrieve the user's JWT for
subsequent API requests).

For example:

```json
{
  "token": "custom-firebase-json-web-token"
}
```

### `request`

The `/api/request` endpoint creates a new lesson request that is awaiting
parental approval (each time a pupil sends a lesson request, the parent must
first approve of the requested tutor before the appointment emails (with a link
to the Bramble room) are sent).

#### Parameters

The following parameters should be sent in the HTTP request body.

| Parameter | Type     | Description                                               |
| --------- | -------- | --------------------------------------------------------- |
| `appt`    | `Appt`   | The tutoring appointment to create a pending request for. |
| `token`   | `string` | The logged in user's Firebase Authentication `idToken`.   |

#### Actions

Upon request, the `/api/request` serverless API function:

1. Performs the following verifications (sends a `400` error code and an
   accompanying human-readable error message if any of them fail):
   - Verifies the correct request body was sent (e.g. all parameters are there
     and are all of the correct types).
   - Verifies that the `attendees` all have user IDs and profile documents.
   - Verifies that the appointment creator (the owner of the given `token` JWT)
     is an `attendee`.
   - Verifies that the requested `Timeslot` is within all of the `attendee`'s
     availability (by reading each `attendee`'s Firestore profile document).
   - Verifies that the requested `subjects` are included in each of the tutors'
     Firestore profile documents (where a tutor is defined as an `attendee` whose
     `roles` include `tutor`).
   - Verifies that the given `token` belongs to one of the `appt`'s `attendees`.
2. Creates [the Bramble tutoring lesson room](https://about.bramble.io/api.html)
   (so that the parent can preview the venue that their child will be using to
   connect with their tutor).
3. Creates a new `request` document containing the given `appt`'s data in the
   pupil's (the owner of the given JWT `token`) Firestore sub-collections.
4. Sends an email to the pupil's parent(s) asking for parental approval of the
   tutoring match.
5. Sends an email to the pupil (the sender of the lesson request) telling them
   that we're awaiting parental approval.

#### Response

The created request object (that includes the ID of it's Firestore document).

### `appt`

The `/api/appt` endpoint approves a pending lesson request and creates a
tutoring appointment.

#### Parameters

The following parameters should be sent in the HTTP request body.

| Parameter | Type     | Description                                                                                                                                                           |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request` | `string` | The path of the pending tutoring lesson's Firestore document to approve (e.g. `partitions/default/users/MKroB319GCfMdVZ2QQFBle8GtCZ2/requests/CEt4uGqTtRg17rZamCLC`). |
| `id`      | `string` | The user ID of the parent approving the lesson request (e.g. `MKroB319GCfMdVZ2QQFBle8GtCZ2`).                                                                         |

#### Actions

Upon request, the `/api/appt` serverless API function:

1. Verifies the correct request body was sent (e.g. all parameters are there and
   are all of the correct types).
2. Fetches the given pending request's data from our Firestore database.
3. Performs the following verifications (some of which are also included in the
   original `/api/request` endpoint):
   - Verifies that the `attendees` all have user IDs and profile documents.
   - Verifies that the pupil (the user whose profile document was referenced in
     the given `request` Firestore document path) is within the `attendees`.
   - Verifies that the parent (the owner of the given `id`) is actually the
     pupil's parent (i.e. the `attendee` whose profile document was referenced
     in the given `request` Firestore document path has the given `id` in their
     profile's `parents` field).
   - Verifies that the requested `Timeslot` is within all of the `attendee`'s
     availability (by reading each `attendee`'s Firestore profile document).
   - Verifies that the requested `subjects` are included in each of the tutors'
     Firestore profile documents (where a tutor is defined as an `attendee` whose
     `roles` include `tutor`).
4. Deletes the old `request` documents.
5. Creates a new `appt` document containing the request body in each of the
   `attendee`'s Firestore `appts` subcollection.
6. Updates each `attendee`'s availability (in their Firestore profile document)
   to reflect this appointment (i.e. remove the appointment's `time` from their
   availability).
7. Sends each of the `appt`'s `attendee`'s an email containing instructions for
   how to access their Bramble virtual-tutoring room.

#### Response

The created appointment object (that includes the ID of the Firestore
documents).
