# Testing

We use [Jest](https://jestjs.io/) for our testing which takes a considerable
amount of tedious configuration for use with
[Typescript](https://www.typescriptlang.org/), [React](https://reactjs.org/),
and [Sass](https://sass-lang.com/).

Our tests are setup using [`ts-jest`](https://kulshekhar.github.io/ts-jest/) for
Typescript type-checking (**not babel** due to what's outlined [here](:

> You’ll get a more fluent TDD experience (when using ts-jest) since files will 
> be type-checked at the same time they’re compiled and ran.

We use Jest's built-in [snapshot 
testing](https://jestjs.io/docs/en/snapshot-testing) capabilities to quickly
confirm that our component's React tree is as expected.

We use this [`identity-obj-proxy`](https://github.com/keyz/identity-obj-proxy)
to stub out our imported Sass modules (as recommended 
[here](https://jestjs.io/docs/en/webpack#mocking-css-modules)).

We'll soon start using Airbnb's 
[Enzyme.js](https://enzymejs.github.io/enzyme/docs/) for jQuery-like support in 
our tests.
