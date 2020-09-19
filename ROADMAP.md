# Roadmap

This is a high-level, (relatively) long-term roadmap for TB. It is organized by
month, with each month having 2-3 large goals and the current blockers for each
goal (low-level issues that must be resolved before that goal becomes reality).

## September 2020

**Officially onboard PAUSD**

- Finalize legal documents (Privacy Policy, TOS) in compliance with CSDPA V2.
- Meet with Derek Moore (CTO), Brent Kline (Paly's Principal), and Wendy
  Stratton (Gunn's Principal) to discuss use case and legalities.
- Train Pam Steward (and Paly's peer-tutoring supervisor) on how to use the new
  app.
- Public (district-wide) communication to parents, students, and teachers about
  the app as a resource.

**Officially onboard EPATT**

- Fix #100 (Zoom Integration) and #99 (time selection) in order to replace
  current workflow.
- Meet with Adrian Amaral to discuss updated use case and new features.

**Start Americorps pilot**

- Follow up with Tara Baltzley on plans to run pilot program in one CA
  Americorps branch.

**Increase quality and maintainability**

- Bring code coverage up to 100% via Cypress integration, component, and unit
  testing (e.g. add API routes tests).
- Refactor Sass styles to reduce duplication. Research best ways to structure
  reusable mixins, variables, functions, etc. Follow best practices used by
  Google's [Material Web Components implementation](https://github.com/material-components/material-components-web/).
- Refactor API routes logic to reuse authentication logic, payload validation
  (using custom type guards), etc. Follow existing design patterns used by
  Express and Connect middleware.
- Add Cypress UI tests on a mobile viewport (and adjust my styling
  accordingly to make it work) and add visual testing.
- Run Cypress UI tests on multiple operating systems and browsers (further
  multiply Travis CI build matrix).

**Fix known bugs**

- Fix all of [these issues](https://github.com/tutorbookapp/tutorbook/issues?q=is%3Aissue+is%3Aopen+label%3Atype%3Abug)
  (that are known bugs and have priority 1).
- Address #116 (restricting profile flow), #69 (select behavior), and #40 (text
  area formatting).
- Fix #47 (follow the format of [Vercel's 404 page](https://vercel.com/404)).

**Add features**

- Create recurring Zoom meetings for every match (#100) via Zoom integration.
- Notify org admins on app activity (#112) via configurable email reports.

## Backlog

**Optimize performance**

- Reduce bundle size to ~50kB "First Load JS" by helping @jamesmfriedman with
  [RMWC](https://github.com/jamesmfriedman/rmwc), removing unnecessary deps,
  etc.
- Create performance tests (using Lighthouse) and [Next.js's performance
  measuring features](https://nextjs.org/docs/advanced-features/measuring-performance).

**AAR project**

- See [this repository](https://github.com/nicholaschiang/aar) for some context.
- Create a LaTex repository, paper structure (i.e. what I'm going to write
  about), and draft an abstract.
- Determine a couple of target journals and different papers (e.g. on the
  different aspects of TB: design, development, outreach) to create for each.
- Create accelerated AAR timeline to write all of those papers (2-3 in total).

**Marketing and outreach**

- Update and expand marketing site to accurately depict org-oriented product.
- Write blog posts for websites like [this
  one](http://www.peertutoringresource.org/) and get featured in local news
  (e.g. the Palo Alto COVID-19 newsletter).

**Add features**

- Support paid tutoring by allowing members of default org to specify an hourly
  rate (#78) and expose "Price" filter to students (#109).
- Give new volunteers and freelancers instant value via community-maintained job
  boards (#97).
- Add analytics dashboard showing feel-good stats (e.g. # of matches, # of
  service hours).
- Make email relay more consistent (#82) by refactoring and adding unit tests.
- Add appointments timeline view (#89) and past appointment logging (#96).
