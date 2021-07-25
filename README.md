[![Tutorbook](https://assets.tutorbook.org/pngs/banner.png)](https://tutorbook.org)

<p align='center'>
  <a aria-label='Release version' href='https://github.com/tutorbookapp/tutorbook/releases'>
    <img src='https://img.shields.io/github/v/release/tutorbookapp/tutorbook?style=flat-square&labelColor=000000'>
  </a>
  <a aria-label='Website status' href='https://tutorbook.org'>
    <img src='https://img.shields.io/website?down_color=lightgrey&down_message=down&up_color=brightgreen&up_message=up&url=https%3A%2F%2Ftutorbook.org&style=flat-square&labelColor=000000'>
  </a>
  <a aria-label='Build status' href='https://github.com/tutorbookapp/tutorbook/actions'>
    <img src='https://img.shields.io/github/workflow/status/tutorbookapp/tutorbook/Build?style=flat-square&labelColor=000000'>
  </a>
  <a aria-label='Integration tests' href='https://dashboard.cypress.io/projects/i6oq5i/runs'>
    <img src='https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/i6oq5i/develop&style=flat-square&labelColor=000000'>
  </a>
  <a aria-label='Coverage status' href='https://codecov.io/gh/tutorbookapp/tutorbook'>
    <img src='https://img.shields.io/codecov/c/gh/tutorbookapp/tutorbook?style=flat-square&labelColor=000000'>
  </a>
  <a aria-label='Dependencies' href='https://david-dm.org/tutorbookapp/tutorbook'>
    <img src='https://img.shields.io/david/tutorbookapp/tutorbook?style=flat-square&labelColor=000000'>
  </a>
  <a aria-label='Maintainability' href='https://codeclimate.com/github/tutorbookapp/tutorbook'>
    <img src='https://img.shields.io/codeclimate/maintainability/tutorbookapp/tutorbook?style=flat-square&labelColor=000000'>
  </a>
</p>

**💥 Attention: This project needs your help! [Message
me](mailto:nicholas@tutorbook.org) if you're interested in becoming a
contributor.**

**👨‍💻 Currently: Working on migrating from [Firebase](https://firebase.com) to
the open-source [Supabase](https://supabase.io) alternative.**

## About Tutorbook

[Tutorbook](https://tutorbook.org) is the best way to manage online tutoring
and mentoring programs.

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
and created through the app. Resources may also specify "tags" (filterable
attributes) that are [totaled daily for our in-app analytics](#analytics).

**Note:** This section is not a complete technical definition of our data model.
Instead, please refer to
[`lib/model`](https://github.com/tutorbookapp/tutorbook/tree/master/lib/model)
for always up-to-date Typescript data model definitions.

### `User`

A user is a person. This person could be a tutor, mentor, student, admin or all
of them at the same time. Those roles are not inscribed on each user but rather
implied by role-specific properties (e.g. a mentor will have subjects specified
in their `mentoring` property).

#### Tags

- **Vetted** - Has at least one verification. Set when the user is created,
  updated, or deleted.
- **Matched** - In at least one match. Set whenever a match is created, updated,
  or deleted.
- **Meeting** - Has at least one meeting. Set whenever a meeting is created,
  updated, or deleted.

Users also have role-based tags (tutor/tutee/mentor/mentee) that are set when:

1. The user is created or updated. Ex: If a user has `tutoring`, they
   are a tutor and thus get the `tutor` tag.
2. A match is created or updated. Ex: If a user is a `tutor` in at least one
   match at some point in time, they are a tutor and thus get the `tutor` tag.

Role tags are never removed: once a user has been a tutor at least once, they
will always be considered a tutor.

### `Org`

An org is a school, nonprofit, or other business entity that is using TB to
manage tutoring and/or mentoring programs.

### `Match`

A match is a pairing of people (typically between a single student and a single
tutor/mentor, but there can be group pairings as well). Matches are simply
containers for [meetings](#meeting).

- Students create matches when they "send a request" to a tutor/mentor from the
  search view.
- Admins can directly create matches (e.g. when migrating from an existing
  system, admins know who's matched with whom).

#### Tags

- **Meeting** - Has at least one meeting. Set whenever a meeting is created,
  updated, or deleted.

### `Meeting`

A meeting is exactly that: a meeting between the people in a [match](#match)
with a specific time and venue (e.g. a specific Zoom link). In order to support
[complex recurrence rules](#recurring-meetings), a meeting's time consists of:

- **From:** The start time of this particular meeting instance.
- **To:** The end time of this particular meeting instance.
- **Recur:** The time's recurrence rule as defined in [the iCalendar
  RFC](https://tools.ietf.org/html/rfc5545). This is used server-side by
  [`rrule`](https://www.npmjs.com/package/rrule) to calculate individual
  meeting instances that are then sent to the client. It is manipulated
  client-side when users select a recurrence rule or choose to add an
  exception to a recurring meeting.
- **Last:** The last possible meeting end time. If a meeting is recurring,
  this will be the end time of the last meeting instance in that recurring
  range. Or, if the recurring range is infinite, I use Firestore's max date
  (Dec 31 9999) which is more than sufficient. This is calculated and assigned
  server-side using [`rrule`](https://www.npmjs.com/package/rrule). It is
  completely ignored client-side (in favor of the `to` property).

Upon creation, Tutorbook sends an email to all of the `people` in the new
meeting's match with the meeting time, venue, and everyone's contact info.

#### Tags

- **Recurring** - Is recurring (has an `rrule`). Set when the meeting is
  created, updated, or deleted.

## Design Specifications

Summarized here are descriptions of common data flow patterns and design specs.
These are some of the front-end design guidelines that TB follows in order to
maintain consistency and display predictable behavior.

### Recurring Meetings

Recurring events are always a struggle to implement. There are [many](https://stackoverflow.com/questions/85699/whats-the-best-way-to-model-recurring-events-in-a-calendar-application) [resources](https://github.com/bmoeskau/Extensible/blob/master/recurrence-overview.md) [available](https://medium.com/@ScullWM/design-and-manage-recurring-events-fb43676e711a)
that are meant to make implementing such recurrence rules easier.

TB's entire recurrence stack is quite simple:

1. Meetings specify complex `RRULE` recur rules with support for event
   exceptions and everything else supported by [`rrule`](https://www.npmjs.com/package/rrule).
2. At index time, the last possible end date is stored in our Algolia index to
   [make querying data more efficient](https://github.com/bmoeskau/Extensible/blob/master/recurrence-overview.md#storage-and-retrieval).
3. When a meeting range is requested, our API parses the recur rules for
   meetings within the requested range (i.e. both the start date and recur end
   date are within the requested date range) and sends the client individual
   meeting instances.
4. When availability is requested, our API again parses the recur rules for
   meetings within the requested availability range and excludes the resulting
   individual meeting instances from the user's weekly availability.

Editing and updating recurring meetings is intuitive:

- When a user updates a single event instance (choosing not to update all
  recurring events), an exception is added to the recurring event's `RRULE` and
  a new regular (i.e non-recurring) meeting is created.
- When a user deletes a single event instance (choosing not to delete all
  recurring events), an exception is added to the recurring event's `RRULE`.

### Analytics

TB uses [Segment](https://segment.com) to collect analytics from both the client
and the server. When defining events, I use Segment's recommended
[object-action framework](https://segment.com/academy/collecting-data/naming-conventions-for-clean-data/).
Each event name includes an object (e.g. Product, Application) and an action on
that object (e.g. Viewed, Installed, Created).

TB also has in-app analytics features for orgs to use. It collects a few totals
every day (based on Algolia tags) and stores them in a Firestore subcollection
(`/orgs/<orgId>/analytics`). Those totals are constantly being updated as API
requests come in (e.g. when a new user is created, TB increments the "Total
Users" statistic by one) and thus are always up-to-date. All of those totals
are based on filterable tags (e.g. "Total Users Matched") which allows admins to
view all the users/matches/meetings that have certain tags, answering questions
like:

- Who are the students or volunteers that aren't matched? Why aren't they?
- Who doesn't have meetings? Why don't they?
- Which students aren't donating money? Why aren't they?

### Zoom Integration

TB ([Tutorbook](https://tutorbook.org)) creates new recurring Zoom meetings for
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

### Forms and Data Mutation

There are two types of data entry forms used throughout TB:

1. **Single update forms.** These are forms that are explicitly submitted by the
   user upon completion (think Google Forms; must be submitted to be saved).
   - Includes inputs, submission button, loading overlay, and error message.
   - Upon submission, these forms:
     1. Show a loading state that prevents further user input.
     2. Immediately mutate local data (to start any expensive re-rendering).
     3. Update remote data with a POST or PUT API request.
     4. If the server sends an error, reset local data and show error message.
        Otherwise, mutate local data with the server's response.
     5. Hide the loading state. Data has been updated or an error has occurred.
   - Ex: New request form, edit user form (in people dashboard), sign-up form.
2. **Continuous update forms.** These are forms that continually receive user
   input, mutate local data, and update remote data at set intervals (think
   Google Docs; continually auto-saves user input).
   - Includes inputs (shows error message via a snackbar).
   - Upon update, these forms:
     1. Immediately mutate local data (unless such a mutation would cause too
        much expensive re-rendering delaying further user input).
     2. Set a timeout to update the remote data (e.g. after 5secs of no change,
        update the remote). Clear any existing timeouts.
     3. Update remote data with a POST or PUT API request.
     4. If the server sends an error, show an error message via a snackbar and
        retry the request. Local data stays mutated. Otherwise, mutate local
        data with the server's response.
   - Ex: Org settings form, profile form, query/search form.

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
- [SWR](https://swr.vercel.app) - Used to manage global state. SWR fetches data
  from our back-end, stores it in a global cache, and allows local mutations of
  that cache (with or without automatic revalidation).

#### Tooling

- [Yarn](https://yarnpkg.com) - To manage dependencies much faster than NPM (and
  for better community support, advanced features, etc).
- [ESLint](https://github.com/eslint/eslint) - For code linting to avoid
  common mistakes and to enforce styling. Follow [these
  instructions](https://eslint.org/docs/user-guide/integrations) to install it
  in the text editor of your choice (such that you won't have to wait until our
  pre-commit hooks fail to update your code).
- [Cypress](https://docs.cypress.io) for integration, UI, and some unit tests.
  Cypress is like Selenium; but built from the ground-up with the developer in
  mind. Cypress runs alongside your code in the browser, enabling DOM snapshots,
  time travel, and overall faster test runs.

#### Database

- [Google's Firebase](https://firebase.google.com/) - For their [NoSQL
  document-based database](https://firebase.google.com/products/firestore),
  [Authentication](https://firebase.google.com/products/auth), and other
  useful (relatively drop-in) solutions.
- [Algolia](https://algolia.com/doc) is synced with our [Firestore
  database](https://firebase.google.com/docs/firestore) via [GCP
  Functions](https://firebase.google.com/docs/functions/firestore-events). TB
  uses Algolia for subject and language selection and to power the primary
  search view capabilities.

## Commit Message Format

I have very precise rules over how Git commit messages in Tutorbook's repository
must be formatted. This format leads to **easier to read commit history**.

Please refer to the following documentation for more info:

- [Conventional Commit Messages](https://www.conventionalcommits.org/en/v1.0.0/)
- [Angular's Commit Message Format](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format)
- [Udacity's Commit Message Style Guide](http://udacity.github.io/git-styleguide/)

### Commit Message Header

Commit messages that do not adhere to the following commit style will not be
merged into `develop`:

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: The page, API route, or component modified.
  │
  └─⫸ Commit Type: ci|docs|feat|fix|perf|refactor|test|deps|chore
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is
optional.

#### Type

Must be one of the following:

- **ci**: Changes to our CI configuration files and scripts.
- **docs**: Documentation only changes.
- **feat**: A new feature.
- **fix**: A bug fix.
- **perf**: A code change that improves performance.
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **test**: Adding missing tests or correcting existing tests.
- **deps**: A change in dependencies.
- **chore**: A code change in utility scripts, build configurations, etc.

#### Scope

The scope should refer to the page, API route, or component modified. This can
be flexible however (e.g. the scope for a `docs:` commit may be the `README`).

#### Summary

Use the summary field to provide a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes".
- Don't capitalize the first letter.
- No dot (.) at the end.

## Development Environment

To setup a development environment for and to contribute to the TB website:

1. Follow [these instructions](https://github.com/nvm-sh/nvm#installing-and-updating)
   to install `nvm` (our suggested way to use Node.js) on your
   machine. Verify that `nvm` is installed by running:

```
$ command -v nvm
```

2. (Optional) If you use [Vim](https://vim.org) as your preferred text editor,
   follow [these instructions](https://freshman.tech/vim-javascript) on setting
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

6. (Optional) Install the [Cypress system dependencies](https://bit.ly/2QHuAiG)
   if you plan on running our integration tests locally.

```
$ sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

7. Clone and `cd` into this repository locally by running:

```
$ git clone https://github.com/tutorbookapp/tutorbook.git && cd tutorbook/
```

8. Follow [these instructions](https://yarnpkg.com/getting-started/install) to
   install `yarn` (our dependency manager for a number of reasons):

```
$ npm i -g yarn
```

9. Then, install of our project's dependencies with the following command:

```
$ yarn
```

10. Follow the instructions included below (see "Available Scripts") to start a
    [Next.js](https://nextjs.org) development server (to see your updates affect
    the app live):

```
$ yarn dev
```

11. Message me (DM **@nicholaschiang** on
    [Slack](https://tutorbookapp.slack.com)) once (not if) you get the following
    error (I have to give you some Firebase API keys to put in the `.env` file):

```
Error [FirebaseError]: projectId must be a string in FirebaseApp.options
```

12. Finally, `cd` into your desired component or lib utility, make your changes,
    commit them to a branch off of `develop`, push it to a [fork of our
    repository](https://github.com/tutorbookapp/covid-tutoring/fork), and open a
    PR on GitHub.

## Available Scripts

All of the below scripts come directly from
[Next.js](https://nextjs.org/docs/getting-started). In the project directory,
you can run:

#### `yarn dev`

This command runs two scripts [concurrently](https://www.npmjs.com/package/concurrently):

1. Runs `next dev` with the Node.js `--inspect` flag on (useful for `debugger`
   statements) to start the Next.js development server.
2. Runs `firebase emulators:start` to start the [Firebase Emulator
   Suite](https://firebase.google.com/docs/emulator-suite).

Open [http://0.0.0.0:3000](http://0.0.0.0:3000) to view the app in the browser
(note that TB uses `0.0.0.0` instead of the default `localhost` for [Intercom
support](https://bit.ly/3cAWfLv). The page will hot-reload if you make edits.
You will also see any lint errors in the console.

Open [http://localhost:4000](http://localhost:4000) to view the
(locally-running) Firebase development console. Here, you can manually seed
Firestore data and view GCP Function logs.

#### `yarn build`

Builds TB's service worker and runs `next build` which builds the application
for production usage.

#### `yarn start`

Runs `next start` which starts a Next.js production server. I have no use for
this right now because I'm deploying to Vercel NOW which handles that for me.

#### `yarn analyze`

Runs the build to generate a bundle size visualizer.

#### `yarn lint`

Runs all of ESLint tests. This should rarely be necessary because you should
have ESLint integrated into your IDE (and thus it should run as you edit code)
and I have Husky running `pretty-quick` before each commit (which should take
care of the styling that ESLint enforces).

#### `yarn style`

Runs our code styling Husky pre-commit hook. TB uses
[Prettier](https://prettier.io) to enforce consistent code formatting throughout
the codebase.

A pre-commit hook is used to format changed files found on commit, however it is
still recommended to install the Prettier plugin in your code editor to ensure
consistent code style.
