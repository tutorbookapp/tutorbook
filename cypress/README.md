# Cypress Tests

All of our tests are currently written using Cypress.

## File Structure

The Cypress test file structure directly mimics the file structure of the source
code being tested. For example, the `cypress/pages/` file structure is
practically the same as the source `pages/` file structure:

```
cypress/pages/
├── api
├── dashboard.spec.ts
├── index.spec.ts
├── login.spec.ts
└── [org]
    ├── dashboard.spec.ts
    ├── index.spec.ts
    ├── matches.spec.ts
    ├── people.spec.ts
    ├── search.spec.ts
    ├── settings
    │   ├── home.spec.ts
    │   ├── index.spec.ts
    │   └── signup.spec.ts
    └── signup.spec.ts

3 directories, 12 files
```

Integration tests are stored in the `pages/` directory (one test per page). Each
integration test includes **at least** the "happy flow" of the page's
functionality.

React-specific component tests are stored in the `components/` directory. These
component tests take advantage of Cypress's [experimental component testing
features](https://docs.cypress.io/guides/references/experiments.html#Component-Testing).

**Note:** While we have an integration test for each page, we only add component
tests when we're unable to cover an edge case in a traditional end-to-end
integration test. See [this blog
post](https://glebbahmutov.com/blog/my-vision-for-component-tests/) for an
example of this approach to writing tests.
