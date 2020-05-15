# [![Tutorbook Logo](https://raw.githubusercontent.com/tutorbookapp/tutorbook/develop/build/favicon/text-logo.png)](https://tutorbook.org/)

[![NPM Version](https://img.shields.io/npm/v/@tutorbook/covid?color=brightgreen)](https://npmjs.com/package/@tutorbook/covid)
[![Dependencies](https://img.shields.io/david/tutorbookapp/covid-tutoring)](https://david-dm.org/tutorbookapp/covid-tutoring)
[![Website Status](https://img.shields.io/website?down_color=lightgrey&down_message=down&up_color=brightgreen&up_message=up&url=https%3A%2F%2Ftutorbook.org%2F)](https://tutorbook.org/)
[![Typescript](https://img.shields.io/badge/uses-typescript-orange?styles=flat)](https://www.typescriptlang.org)
[![Lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

**[Tutorbook](https://tutorbook.org/) is an online volunteer tutoring platform**
that connects students in need (who no longer have face-to-face support from
teachers) with volunteer tutors (who want to make a difference from home).

#### The problem

- Students no longer have the individualized support teachers usually have given
  (when they met face-to-face)
- Teachers can no longer attend to each student individually; some students are
  falling behind

#### The solution

- Support those students by connecting them to university students and
  professionals also confined in their homes
- Enable teachers to request one-on-one help for students they know are
  struggling

#### Current work

Here's what we're working on at a super high-level:

1. Building out a front-end where students and tutors can sign-up to be
   connected to one another.
2. Building out a back-end to automatically match students with tutors and send
   them three links:
   - Link to video call
   - Link to virtual whiteboard (probably using
     [DrawChat](https://github.com/cojapacze/sketchpad))
   - Link to shared Google Drive folder

# Contributing

Do the following (preferably in order):

1. Join our [Slack workspace](https://tutorbookapp.slack.com).
2. Check the `#development` channel pins for more information on how you can
   help out.
3. Read through the links included below to become familiar with our current tech
   stack.
4. Contribute:
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

- [Lerna](https://lerna.js.org/) - To manage and re-use React components across
  repositories; mostly just to migrate code from this project back into
  [Tutorbook](https://tutorbook.app/docs/) when we get the chance.
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
3. Run the following command to install Node.js v12.16.1 (our current version):

```
$ nvm i 12.16.1
```

4. (Optional) Run the following command to set Node.js v12.16.1 as your default
   Node.js version (useful if you have multiple Node.js versions installed and
   don't want to have to remember to switch to v12.16.1):

```
$ nvm alias default 12.16.1
```

5. Ensure that you have recent versions of Node.js and it's package manager
   `npm` by running:

```
$ node -v
12.16.1
$ npm -v
6.13.4
```

6. Make sure that you have [Lerna](https://lerna.js.org) installed by running:

```
$ npm i -g lerna
```

7. Clone and `cd` into this repository locally by running:

```
$ git clone https://github.com/tutorbookapp/covid-tutoring.git && cd covid-tutoring/
```

8. Then, install of our project's dependencies with the following command:

```
$ npm i && lerna bootstrap --hoist
```

9. Follow the instructions included below (see "Available Scripts") to start a
   [Next.js](https://nextjs.org) development server (to see your updates affect
   the app live):

```
$ npm run dev
```

10. Message me (DM **@nicholaschiang** on
    [Slack](https://tutorbookapp.slack.com)) once (not if) you get the following
    error (I have to give you some Firebase API keys to put in the `.env` file):

```
Error [FirebaseError]: projectId must be a string in FirebaseApp.options
```

11. Finally, `cd` into your desired package (included in `src/`), make your
    changes, commit them to a branch off of `develop`, push it to a [fork of our
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

#### `npm run dev`

Runs `next dev` using `full-icu` and with the Node.js `--inspect` flag on
(useful for `debugger;` statements) which starts Next.js in development mode.

Open [http://0.0.0.0:3000](http://0.0.0.0:3000) to view the app in the browser
(note that we use `0.0.0.0` instead of the default `localhost` for [Intercom
support](https://bit.ly/3cAWfLv). The page will hot-reload if you make edits.
You will also see any lint errors in the console.

#### `npm run build`

Runs `next build` which builds the application for production usage.

#### `npm run start`

Runs `next start` which starts a Next.js production server.
