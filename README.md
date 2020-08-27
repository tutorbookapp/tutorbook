# [![Tutorbook Logo](https://raw.githubusercontent.com/tutorbookapp/old-tutorbook/develop/build/favicon/text-logo.png)](https://tutorbook.org/)

[![Release Version](https://img.shields.io/github/v/release/tutorbookapp/tutorbook?color=brightgreen)](https://github.com/tutorbookapp/tutorbook/releases/)
[![Dependencies](https://img.shields.io/david/tutorbookapp/tutorbook)](https://david-dm.org/tutorbookapp/tutorbook)
[![Website Status](https://img.shields.io/website?down_color=lightgrey&down_message=down&up_color=brightgreen&up_message=up&url=https%3A%2F%2Ftutorbook.org%2F)](https://tutorbook.org/)
[![Typescript](https://img.shields.io/badge/uses-typescript-orange?styles=flat)](https://www.typescriptlang.org)
[![Lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

**[Tutorbook](https://tutorbook.org) is the best way to manage tutoring and
mentoring programs (virtually).**

It's an online app used by organizations (i.e. nonprofits, K-12 schools) to:

- Match students with tutors and mentors (e.g. by subjects, availability,
  languages spoken).
- Manage and track those matches (e.g. via a communications timeline and tags).

Students use Tutorbook to:

- Search their school's tutors/mentors themselves (instead of having an admin
  match them up).
- Keep track of appointments and availability (e.g. via the schedule view).

Parents and teachers use Tutorbook to:

- Request tutors/mentors for their students (those requests are then fulfilled
  by an admin who matches the student with the appropriate tutor/mentor).
- Track their student's matches (e.g. via the communications timeline).

## Terminology and Data Model

This is a high-level overview of the various resources ("things") manipulated by
and created through the app.

**Note:** This section is not a complete technical definition of our data model.
Instead, please refer to
[`lib/model`](https://github.com/tutorbookapp/tutorbook/tree/master/lib/model)
for always up-to-date Typescript data model definitions.

### `User`

A user is a person. This person could be a tutor, mentor, student, admin or all
of them at the same time. Those roles are not inscribed on each user but rather
implied by role-specific properties (e.g. a mentor will have subjects specified
in their `mentoring.subjects` property).

### `Org`

An org is a school or nonprofit or other business entity that is using TB to
manage their tutoring and mentoring programs.

### `Request`

A request is a job post. Typically created by parents or teachers, it comprises
of:

- The student who needs help (e.g. "Nicholas Chiang").
  - When the student is available (this is included in the student's profile).
- The subjects he/she needs help with (e.g. "AP Computer Science A"). This is
  also added to the student's profile under their `tutoring.searches` property.
- A concise description of what specifically the student is struggling with
  (e.g. "Nicholas doesn't understand Java arrays and sorting algorithms").

**Note:** Requests can also be created by admins (and often are). For example,
an admin might need to migrate the results of a Google Form to Tutorbook (by
creating the requests all at once and then fulfilling them over time).

Once created, a request is fulfilled by an admin, who searches on behalf of the
student and creates a match (between the student and an appropriate
tutor/mentor).

### `Match`

A match is a pairing of people (typically between a single student and a single
tutor/mentor, but there can be group pairings as well). Matches can specify
times (e.g. "Every Monday at 3-4pm") and meeting venues (e.g. "Use this Zoom
meeting room" or "Use this Google Meet link").

- Students create matches when they "send a request" to a tutor/mentor from the
  search view.
- Admins can directly create matches (e.g. when migrating from an existing
  system, admins know who's matched with whom).
- Admins can create matches to fulfill requests (e.g. a teacher requests help
  for their struggling student and the admin finds that help).

Upon creation, Tutorbook sends an email to everyone in the match (all of the
`attendees`) with everyone's anonymous contact info.

Tutorbook has a system like
[Craigslist's](https://www.craigslist.org/about/anonymize) where each attendee
in each match has a unique anonymous email address (e.g.
`88626b40-49c7-bd16-a845-ece7527cded7@mail.tutorbook.org`). Emails can then be
intercepted by Tutorbook and added to the in-app communications timeline before
being relayed to their intended recipients.

## Integrations and Data Flow

Summarized here are descriptions of common data flow patterns and integration
use cases.

### Zoom

TB ([Tutorbook](https://tutorbook.app)) creates new recurring Zoom meetings for
every [match](#match). To do so, TB stores Zoom OAuth refresh tokens and account
IDs within [user](#user) and [org](#org) profiles.

Orgs have two options when authorizing TB to use their Zoom account:

1. **Create new users:** TB will create new Zoom users (within the org's Zoom
   account) for each user created on TB (using the user's _actual_ email address
   and falling back to the user's _TB-assigned anonymous_ email address
   (e.g. `dfadf-adwei8e-dw934sd@mail.tutorbook.org` instead of
   `my.personal.email@gmail.com`) if that fails). TB then uses those Zoom users
   when creating Zoom meetings.
   - Requires both the **meeting:write:admin** scope _and_ the
     **user:write:admin** scope.
2. **Assume users already exist:** TB will assume that Zoom users (using the
   user's _actual_ email address) already exist (within the org's Zoom account)
   for each user created on TB. TB then reuses those existing Zoom users when
   creating Zoom meetings.
   - Requires only the **meeting:write:admin** scope.

Smaller orgs may opt for option one (for convenience) while larger orgs (e.g.
entire school districts) will likely use option two (because they already have
Zoom users for each of their students and tutors).

Option two is recommended when possible because it does not require users to
login to Zoom using their TB-assigned anonymous email address (as they must be
logged into the correct Zoom account to host the [match](#match) Zoom meetings).

Because [Zoom pricing](https://zoom.us/pricing) is per user license, TB will
only create Zoom user accounts when it has to (i.e. when a [match](#match) is
created and none of the match's `people` already have Zoom user accounts). When
creating a Zoom meeting for a match:

1. TB will first try using the tutor or mentor Zoom user accounts.
2. If that fails, TB will try using the student (i.e. `tutee` and `mentee`) Zoom
   user accounts.
   - TB will not attempt to use `people` who do not have any `roles` listed (as
     those people were likely added just because they were on an email thread
     with one of the tutors, mentors, or students).
3. If all of that fails (i.e. there are no existing Zoom user accounts for the
   match's people within the match's org), TB will try to create a new Zoom user
   account for the match's tutor or mentor within the match's org.
4. If that still fails (i.e. the org chose option two and doesn't allow TB to
   create new Zoom users), TB will fallback to using [Jitsi](https://jitsi.org).

For more info on our Zoom integration, see [this
issue](https://github.com/tutorbookapp/tutorbook/issues/100).

# Contributing

Do the following (preferably in order):

1. Join our [Slack workspace](https://join.slack.com/t/tutorbookapp/shared_invite/zt-ekmpvd9t-uzH_HuS6KbwVg480TAMa5g).
2. Message `#introductions` with who you are and how you can help (and _what_
   you'll find the most interesting to work on).
3. Check the `#development` channel pins for more information on how you can
   help out.
4. Read through the links included below to become familiar with our current tech
   stack.
5. Contribute:
   - Choose [an
     issue](https://github.com/orgs/tutorbookapp/projects/2?fullscreen=true) (from
     the top of the **To Do** column; the most pressing issues are at the top).
   - [Fork this repository](https://github.com/tutorbookapp/covid-tutoring/fork).
   - Address the issue.
   - [Create a PR](https://github.com/tutorbookapp/covid-tutoring/compare).

Also feel free to check out our recently added `tutorials/` directory for
additional information detailing different aspects of this project (e.g. tests,
deployment workflows, CI/CD, etc).

This project uses (please ensure that you're familiar with our tech stack before
trying to contribute; it'll save your reputation and a lot of time):

#### Languages

- [Typescript](https://www.typescriptlang.org) - As our language of choice
  (mostly for static typing, stronger linting capabilities, and the potential
  for beautifully detailed--and completely automatically generated--
  documentation). Typescript is also [well supported by
  Next.js](https://nextjs.org/docs/basic-features/typescript) and
  [React](https://reactjs.org/docs/static-type-checking.html#typescript).
- [Sass](https://sass-lang.com) - For styling components (i.e. CSS on steroids).
  Sass, like Typescript, is also [well supported by Next.js
  out-of-box.](https://nextjs.org/docs/basic-features/built-in-css-support#sass-support)

#### Frameworks

- [React](https://reactjs.org) - As our front-end framework.
- [Next.js](https://nextjs.org) - To easily support
  [SSR](https://nextjs.org/docs/basic-features/pages#server-side-rendering) and
  other performance [PWA](https://web.dev/progressive-web-apps/) features.

#### Tooling

- [Yarn](https://yarnpkg.com) - To manage dependencies much faster than NPM (and
  for better community support, advanced features, etc).
- [ESLint](https://github.com/eslint/eslint) - For code linting to avoid
  common mistakes and to enforce styling. Follow [these
  instructions](https://eslint.org/docs/user-guide/integrations) to install it
  in the text editor of your choice (such that you won't have to wait until our
  pre-commit hooks fail to update your code).

#### Database

- [Google's Firebase](https://firebase.google.com/) - For their [NoSQL
  document-based database](https://firebase.google.com/products/firestore),
  [Authentication](https://firebase.google.com/products/auth), and other
  useful (relatively drop-in) solutions.

## Development Environment

To setup a development environment for and to contribute to the COVID Tutoring
Initiative website:

1. Follow [these instructions](https://github.com/nvm-sh/nvm#installing-and-updating)
   to install `nvm` (our suggested way to use Node.js) on your
   machine. Verify that `nvm` is installed by running:

```
$ command -v nvm
```

2. (Optional) If you use [Vim](https://vim.org) as your preferred text editor,
   follow [these instructions](https://freshman.tech/vim-javascript/) on setting
   up [Vim](https://vim.org) for editing JavaScript.
3. Run the following command to install Node.js v12.18.3 (our current version):

```
$ nvm i 12.18.3
```

4. (Optional) Run the following command to set Node.js v12.18.3 as your default
   Node.js version (useful if you have multiple Node.js versions installed and
   don't want to have to remember to switch to v12.18.3):

```
$ nvm alias default 12.18.3
```

5. Ensure that you have recent versions of Node.js and it's package manager
   `npm` by running:

```
$ node -v
12.18.3
$ npm -v
6.14.7
```

6. Clone and `cd` into this repository locally by running:

```
$ git clone https://github.com/tutorbookapp/tutorbook.git && cd tutorbook/
```

7. Follow [these instructions](https://yarnpkg.com/getting-started/install) to
   install `yarn` (our dependency manager for a number of reasons):

```
$ npm i -g yarn
```

8. Then, install of our project's dependencies with the following command:

```
$ yarn install
```

9. Follow the instructions included below (see "Available Scripts") to start a
   [Next.js](https://nextjs.org) development server (to see your updates affect
   the app live):

```
$ yarn run dev
```

10. Message me (DM **@nicholaschiang** on
    [Slack](https://tutorbookapp.slack.com)) once (not if) you get the following
    error (I have to give you some Firebase API keys to put in the `.env` file):

```
Error [FirebaseError]: projectId must be a string in FirebaseApp.options
```

11. Finally, `cd` into your desired component or lib utility, make your changes,
    commit them to a branch off of `develop`, push it to a [fork of our
    repository](https://github.com/tutorbookapp/covid-tutoring/fork), and open a
    PR on GitHub.

#### Code Format

Tutorbook uses [Prettier](https://prettier.io/) to enforce consistent code
formatting throughout the codebase.

A pre-commit hook is used to format changed files found on commit, however it is
still recommended to install the Prettier plugin in your code editor to ensure
consistent code style.

## Available Scripts

All of the below scripts come directly from
[Next.js](https://nextjs.org/docs/getting-started). In the project directory,
you can run:

#### `yarn run dev`

Runs `next dev` using `full-icu` and with the Node.js `--inspect` flag on
(useful for `debugger;` statements) which starts Next.js in development mode.

Open [http://0.0.0.0:3000](http://0.0.0.0:3000) to view the app in the browser
(note that we use `0.0.0.0` instead of the default `localhost` for [Intercom
support](https://bit.ly/3cAWfLv). The page will hot-reload if you make edits.
You will also see any lint errors in the console.

#### `yarn run build`

Runs `next build` which builds the application for production usage.

#### `yarn run start`

Runs `next start` which starts a Next.js production server. We have no use for
this right now because we're deploying to Vercel NOW which handles that for us.

#### `yarn run analyze`

Runs the build to generate a bundle size visualizer.

#### `yarn run lint`

Runs all of ESLint tests. This should rarely be necessary because you should
have ESLint integrated into your IDE (and thus it should run as you edit code)
and we have Husky running `pretty-quick` before each commit (which should take
care of the styling that ESLint enforces).
