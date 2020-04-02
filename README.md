# Covid Tutoring

Landing page and booking MVP to connect volunteer tutors and pupils amidst the
COVID-19 pandemic.

## Volunteer

We are building a massive academic support network and systems to bolster our
educational infrastructure in this difficult time.

If you have expertise in marketing, management, teaching, tech, or just want to
help out we would love to hear from you!

## Our Vision

Included below is a brief outline of our vision for this project.

### The problem

- Students no longer have the individualized support teachers usually have given
  (when they met face-2-face)
- Teachers can no longer attend to each student individually; some students are
  falling behind

### The solution
- Support those students by connecting them to university students and
  professionals also confined in their homes
- Enable teachers to request one-on-one help for students they know are
  struggling

### How you can help

[**@nicholaschiang**](https://github.com/nicholaschiang) is going to be heading
up the dev side of things while [**@alephtaw**](https://github.com/alephta) 
works full-time on business (so ask him if you're interested in that). As for 
dev, here's what we're working on:
1. Choosing a front-end framework that most of us are familiar with (currently,
   we're going to go with [React](https://reactjs.org) using
   [Typescript](https://www.typescriptlang.org/)).
2. Building out a front-end where students and tutors can sign-up to be
   connected to one another.
3. Building out a back-end to automatically match students with tutors and send
   them three links:
   - Link to video call
   - Link to virtual whiteboard (probably using
     [DrawChat](https://github.com/cojapacze/sketchpad))
   - Link to shared Google Drive folder

### What you can do now
- Head over to our [new Slack workspace](https://covidtutoring.slack.com).
- Check the `#development` channel pins for more information on how you can help
  out.

## Developing 

Check out this project's [documentation](https://covidtutoring.org/docs/)
(automatically generated using [JSDoc 3](https://jsdoc.app)) or head over to our
[main repository](https://github.com/tutorbookapp/tutorbook) and [main
documentation](https://tutorbook.app/docs/) for more detailed information.

This project uses:

**Languages**
- [Typescript](https://www.typescriptlang.org) - As our language of choice
  (mostly for static typing, stronger linting capabilities, and the potential
  for beautifully detailed--and completely automatically generated--
  documentation). Typescript is also [well supported by 
  Next.js](https://nextjs.org/docs/basic-features/typescript) and 
  [React](https://reactjs.org/docs/static-type-checking.html#typescript).
- [Sass](https://sass-lang.com) - For styling components. Sass, like Typescript,
  is also [well supported by Next.js 
  out-of-box](https://nextjs.org/docs/basic-features/built-in-css-support#sass-support)

**Frameworks**
- [React](https://reactjs.org) - As our front-end framework.
- [Next.js](https://nextjs.org) - To easily support 
  [SSR](https://nextjs.org/docs/basic-features/pages#server-side-rendering) and
  other performance [PWA](https://web.dev/progressive-web-apps/) features.

**Tooling**
- [Lerna](https://lerna.js.org/) - To manage and re-use React components across
  repositories; mostly just to migrate code from this project back into
  [Tutorbook](https://tutorbook.app/docs/) when we get the chance.
- [ESLint](https://github.com/eslint/eslint) - For code linting to avoid
  common mistakes and to enforce styling. Follow [these
  instructions](https://eslint.org/docs/user-guide/integrations) to install it 
  in the text editor of your choice (such that you won't have to wait until our
  pre-commit hooks fail to update your code).

**Database**
- [Google's Firebase](https://firebase.google.com/) - For their [NoSQL
  document-based database](https://firebase.google.com/products/firestore),
  [Authentication](https://firebase.google.com/products/auth), and other
  useful (relatively drop-in) solutions.

### Available Scripts

All of the below scripts come directly from 
[Next.js](https://nextjs.org/docs/getting-started). In the project directory, 
you can run:

#### `npm run dev`

Runs `next` which starts Next.js in development mode

Open [http://localhost:3000](http://localhost:3000) to view the app in the 
browser.

The page will reload if you make edits.

You will also see any lint errors in the console.

#### `npm run build`

Runs `next build` which builds the application for production usage

#### `npm run start`

Runs `next start` which starts a Next.js production server
