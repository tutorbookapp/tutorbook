const path = require('path');

const algoliasearch = require('algoliasearch');
const axios = require('axios');
const dotenv = require('dotenv');
const { serialize } = require('cookie');
const logger = require('./lib/logger');

const admin = require('../cypress/fixtures/users/admin.json');
const meeting = require('../cypress/fixtures/meeting.json');
const org = require('../cypress/fixtures/orgs/default.json');
const school = require('../cypress/fixtures/orgs/school.json');
const student = require('../cypress/fixtures/users/student.json');
const volunteer = require('../cypress/fixtures/users/volunteer.json');

// Follow the Next.js convention for loading `.env` files.
// @see {@link https://nextjs.org/docs/basic-features/environment-variables}
const env = process.env.NODE_ENV || 'development';
[
  path.resolve(__dirname, `../.env.${env}.local`),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, `../.env.${env}`),
  path.resolve(__dirname, '../.env'),
].forEach((dotfile) => {
  logger.info(`Loaded env from ${dotfile}`);
  dotenv.config({ path: dotfile });
});

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY;
const search = algoliasearch(algoliaId, algoliaKey);

const prefix = process.env.ALGOLIA_PREFIX || env;
const usersIdx = search.initIndex(`${prefix}-users`);
const meetingsIdx = search.initIndex(`${prefix}-meetings`);

async function seed(overrides = {}) {
  let orgs = [];
  orgs.push({ ...org, ...overrides.org });
  orgs.push({ ...school, ...overrides.school });
  if (overrides.org === null) delete orgs[0];
  if (overrides.school === null) delete orgs[1];
  orgs = orgs.filter(Boolean);

  let users = [];
  users.push({ ...volunteer, ...overrides.volunteer });
  users.push({ ...student, ...overrides.student });
  users.push({ ...admin, ...overrides.admin });
  if (overrides.volunteer === null) delete users[0];
  if (overrides.student === null) delete users[1];
  if (overrides.admin === null) delete users[2];
  users = users.filter(Boolean);

  let meetings = [];
  meetings.push({ ...meeting, ...overrides.meeting });
  if (overrides.meeting === null) delete meetings[0];
  meetings = meetings.filter(Boolean);

  const rconfig = {
    headers: { authorization: `Bearer ${process.env.API_TOKEN}` },
  };

  async function create(route, data) {
    logger.info(`Creating ${data.length} ${route}...`);
    const endpoint = `http://localhost:3000/api/${route}`;
    await Promise.all(data.map((d) => axios.post(endpoint, d, rconfig)));
  }

  async function update(route, data) {
    logger.info(`Updating ${data.length} ${route}...`);
    const end = `http://localhost:3000/api/${route}`;
    await Promise.all(data.map((d) => axios.put(`${end}/${d.id}`, d, rconfig)));
  }

  await create(
    'orgs',
    orgs.map((o) => ({ ...o, members: [] }))
  );

  // We have to create the admin first because TB's back-end will try to
  // fetch his data when sending user creation notification emails.
  await create(
    'users',
    users.filter((u) => u.id === 'admin')
  );

  await update('orgs', orgs);

  await create(
    'users',
    users.filter((u) => u.id !== 'admin')
  );

  await create('meetings', meetings);
}

if (require.main === module) seed();
