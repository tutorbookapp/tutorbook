const fs = require('fs');
const path = require('path');
const axios = require('axios');
const phone = require('phone');
const dotenv = require('dotenv');
const parse = require('csv-parse');
const winston = require('winston');
const prompt = require('prompt-sync')();
const algoliasearch = require('algoliasearch');
const parseSync = require('csv-parse/lib/sync');
const { default: to } = require('await-to-js');
const { v4: uuid } = require('uuid');
const { nanoid } = require('nanoid');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const env = 'production';
const apiDomain = 'https://develop.tutorbook.app';
logger.info(`Loading ${env} environment variables...`);
[
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, `../../.env.${env}`),
  path.resolve(__dirname, `../../.env.${env}.local`),
].map((path) => {
  logger.debug(`Loading .env file (${path})...`);
  dotenv.config({ path });
});

const admin = require('firebase-admin');
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  }),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
});

const firebase = require('firebase/app');
require('firebase/auth');

const clientCredentials = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
if (!firebase.apps.length) firebase.initializeApp(clientCredentials);

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY || '';
const client = algoliasearch(algoliaId, algoliaKey);
const searchIdx = client.initIndex(`${env}-users`);

const fields = {
  location: 'Location',
  teamMember: 'Team Member',
  service: 'Service Type',
  date: 'Date', // Formatted as '24 Jan 2021, 9:00 AM' (w/out end time).
  bookingNotes: 'Booking Notes',
  status: 'Status', // Either 'Confirmed' or 'New'
  customerName: 'Customer Name',
  email: 'Email',
  phone: 'Phone',
  experience:
    'Experience Level (never played, beginner, intermediate, advanced)',
  phoneNumber: 'Phone Number',
  studentName: 'Student Name',
  reference: 'How did you hear about Quarantunes?',
  city: 'What city/state are you located in?',
  age: 'Student Age',
};

const emptyUser = {
  created: new Date().toJSON(),
  updated: new Date().toJSON(),
  id: '',
  name: '',
  photo: '',
  email: '',
  phone: '',
  bio: '',
  background: '',
  socials: [],
  orgs: [],
  zooms: [],
  availability: [],
  mentoring: { subjects: [], searches: [] },
  tutoring: { subjects: [], searches: [] },
  langs: ['en'],
  parents: [],
  verifications: [],
  visible: false,
  featured: [],
  roles: [],
  reference: '',
};

const usersCachePath = './team-member-to-user.json';
const usersCache = require(usersCachePath);
async function getUser({ name, email, phone }) {
  if (usersCache[name]) {
    logger.debug(`Found ${name} in users cache.`);
    return usersCache[name];
  }
  const searchString = (name || '').split(' (')[0];
  const searchOptions = { restrictSearchableAttributes: ['name'] };
  if (email === '-') {
    logger.debug('Skipping invalid email filter...');
  } else if (email && phone) {
    searchOptions.filters = `email:"${email}"`;
    searchOptions.optionalFilters = `phone:"${phone}"`;
  } else if (email) {
    searchOptions.filters = `email:"${email}"`;
  } else if (phone) {
    searchOptions.filters = `phone:"${phone}"`;
  }
  const searchOptionsStr = JSON.stringify(searchOptions, null, 2);
  logger.debug(`Searching (${searchString}): ${searchOptionsStr}`);
  const { hits } = await searchIdx.search(searchString, searchOptions);
  if (!hits.length)
    throw new Error(`No results (${searchString}): ${searchOptionsStr}`);
  const user = { ...(hits[0] || {}), id: (hits[0] || {}).objectID || '' };
  usersCache[name] = user;
  fs.writeFileSync(usersCachePath, JSON.stringify(usersCache, null, 2));
  return user;
}

async function getOrCreateUser({ name, email, phone, ...rest }) {
  try {
    const user = await getUser({ name, email, phone });
    return user;
  } catch (e) {
    logger.warn(`${e.name} fetching ${name} (${email || phone}): ${e.message}`);
    const user = {
      ...emptyUser,
      name: name || '',
      email: email || '',
      phone: phone || '',
      created: new Date().toJSON(),
      updated: new Date().toJSON(),
      ...rest,
    };
    logger.debug(`Creating user: ${JSON.stringify(user, null, 2)}`);
    const [err, res] = await to(axios.post(`${apiDomain}/api/users`, user));
    if (err) {
      logger.error(
        `${err.name} creating ${user.name}: ${
          err.response ? err.response.data.message : err.message
        }`
      );
      debugger;
      return user;
    } else {
      logger.info(`Created ${res.data.name} (${res.data.id}).`);
      usersCache[name] = res.data;
      fs.writeFileSync(usersCachePath, JSON.stringify(usersCache, null, 2));
      return res.data;
    }
  }
}

const validSubjects = parseSync(fs.readFileSync('../algolia/mentoring.csv'), {
  skip_empty_lines: true,
  columns: true,
});
const validSubjectNames = validSubjects.map((s) => s.name);
function isValidSubject(subjectName) {
  return validSubjectNames.includes(subjectName);
}

const subjectsCachePath = './services-to-subjects.json';
const subjectsCache = require(subjectsCachePath);
function getSubject(service) {
  if (isValidSubject(service)) return service;
  if (isValidSubject(service.replace(' Lesson', '')))
    return service.replace(' Lesson', '');
  while (!subjectsCache[service]) {
    let validSubject = false;
    let subject = '';
    while (!validSubject) {
      subject = prompt(`What subject is "${service}"? `);
      validSubject = isValidSubject(subject);
    }
    subjectsCache[service] = subject;
    fs.writeFileSync(subjectsCachePath, JSON.stringify(subjectsCache, null, 2));
  }
  return subjectsCache[service];
}

function generateStudentBio(row, subject) {
  let bio = `I'm a student who originally signed up on Picktime.`;
  if (row[fields.experience])
    bio += `\nExperience with ${subject}: ${row[fields.experience]}`;
  if (row[fields.city]) bio += `\nCurrently located in: ${row[fields.city]}`;
  if (row[fields.age]) bio += `\nAge: ${row[fields.age]}`;
  return bio;
}

function generateMatchMessage(row) {
  return row[fields.bookingNotes] || '';
}

function generateMeetingNotes(row) {
  return row[fields.bookingNotes] || '';
}

/**
 * Given a Picktime formatted date string, returns the meeting timeslot.
 * @param {string} dateStr - The Picktime formatted date string (e.g. '24 Jan 2021, 9:00 AM').
 * @param {number} duration - The meeting duration in mins (default to 60mins).
 * @return {Timeslot} - The timeslot in JSON-friendly format.
 */
function getMeetingTime(dateStr, duration = 60) {
  const [date, mo, yr, time, ampm] = dateStr.replace(',', '').split(' ');
  const monthIdx = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ].indexOf(mo);
  const [hrsStr, minsStr] = time.split(':');
  const hrs = Number(hrsStr) + (ampm === 'PM' ? 12 : 0);
  const mins = Number(minsStr);
  const start = new Date(yr, monthIdx, date, hrs, mins);
  const end = new Date(start.valueOf() + duration * 60 * 1000);
  return { id: nanoid(), from: start.toJSON(), to: end.toJSON() };
}

async function getToken(uid = '1j0tRKGtpjSX33gLsLnalxvd1Tl2') {
  const token = await app.auth().createCustomToken(uid);
  await firebase.auth().signInWithCustomToken(token);
  const idToken = await firebase.auth().currentUser.getIdToken(true);
  await firebase.auth().signOut();
  return idToken;
}

const matchesCreatedPath = './matches-created.json';
const matchesCreated = require(matchesCreatedPath);
async function convertPicktimeRow(row, headers) {
  const subject = getSubject(row[fields.service]);
  logger.debug(`Fetched subjects (${row[fields.service]}): ${subject}`);
  const student = await getOrCreateUser({
    name: row[fields.customerName] || row[fields.studentName] || '',
    email: row[fields.email] || '',
    phone: phone(row[fields.phone] || row[fields.phoneNumber])[0] || '',
    bio: generateStudentBio(row, subject),
    orgs: ['quarantunes'],
    mentoring: { subjects: [], searches: [subject] },
    reference: row[fields.reference] || '',
  });
  logger.debug(`Fetched student: ${student.name} (${student.id}).`);
  const mentor = await getUser({ name: row[fields.teamMember] });
  logger.debug(`Fetched mentor: ${mentor.name} (${mentor.id}).`);
  const matchId = encodeURIComponent(
    JSON.stringify([
      subject,
      generateMatchMessage(row),
      student.id,
      student.name,
      student.photo,
      mentor.id,
      mentor.name,
      mentor.photo,
    ])
  );
  if (!matchesCreated[matchId]) {
    const match = {
      org: 'quarantunes',
      subjects: [subject],
      people: [
        {
          id: student.id || '',
          name: student.name || '',
          photo: student.photo || '',
          handle: uuid(),
          roles: ['mentee'],
        },
        {
          id: mentor.id || '',
          name: mentor.name || '',
          photo: mentor.photo || '',
          handle: uuid(),
          roles: ['mentor'],
        },
      ],
      creator: {
        id: student.id || '',
        name: student.name || '',
        photo: student.photo || '',
        handle: uuid(),
        roles: ['mentee'],
      },
      message: generateMatchMessage(row),
      updated: new Date().toJSON(),
      created: new Date().toJSON(),
      id: '',
    };
    logger.debug(`Creating match: ${JSON.stringify(match, null, 2)}`);
    const [err, res] = await to(
      axios.post(`${apiDomain}/api/matches`, match, { headers })
    );
    if (err) {
      logger.error(
        `${err.name} creating match for ${match.subjects.join(
          ', '
        )} with ${match.people.map((p) => p.name).join(' and ')}: ${
          err.response ? err.response.data.message : err.message
        }`
      );
      debugger;
    } else {
      logger.info(
        `Created match for ${res.data.subjects.join(
          ', '
        )} with ${res.data.people.map((p) => p.name).join(' and ')} (${
          res.data.id
        }).`
      );
      matchesCreated[matchId] = res.data;
      fs.writeFileSync(
        matchesCreatedPath,
        JSON.stringify(matchesCreated, null, 2)
      );
    }
  }
  const venueId = nanoid(10);
  const meeting = {
    match: matchesCreated[matchId],
    status: 'created',
    creator: {
      id: student.id || '',
      name: student.name || '',
      photo: student.photo || '',
      handle: uuid(),
      roles: ['mentee'],
    },
    venue: {
      id: venueId,
      url: `https://meet.jit.si/TB-${venueId}`,
      invite: `Open https://meet.jit.si/TB-${venueId} to join your meeting.`,
      type: 'jitsi',
      updated: new Date().toJSON(),
      created: new Date().toJSON(),
    },
    time: getMeetingTime(row[fields.date]),
    notes: generateMeetingNotes(row),
    updated: new Date().toJSON(),
    created: new Date().toJSON(),
    id: '',
  };
  logger.silly(`Generated meeting: ${JSON.stringify(meeting, null, 2)}`);
  return meeting;
}

const meetingsCreatedPath = './meetings-created.txt';
const meetingsCreated = fs
  .readFileSync(meetingsCreatedPath)
  .toString()
  .split('\n');
async function importPicktime(path) {
  const meetings = [];
  const headers = { authorization: `Bearer ${await getToken()}` };
  const parser = fs.createReadStream(path).pipe(
    parse({
      skip_empty_lines: true,
      columns: true,
    })
  );
  for await (const record of parser) {
    delete record['S.No'];
    const meetingId = encodeURIComponent(JSON.stringify(Object.values(record)));
    if (meetingsCreated.includes(meetingId)) continue;
    const meeting = await convertPicktimeRow(record, headers);
    logger.debug(`Creating meeting: ${JSON.stringify(meeting, null, 2)}`);
    const [err, res] = await to(
      axios.post(`${apiDomain}/api/meetings`, meeting, { headers })
    );
    if (err) {
      logger.error(
        `${err.name} creating meeting at ${new Date(
          meeting.time.from
        ).toString()} for ${
          meeting.match ? meeting.match.subjects.join(', ') : undefined
        } with ${
          meeting.match
            ? meeting.match.people.map((p) => p.name).join(' and ')
            : undefined
        }: ${err.response ? err.response.data.message : err.message}`
      );
      debugger;
    } else {
      logger.info(
        `Created meeting at ${new Date(
          res.data.time.from
        ).toString()} for ${res.data.match.subjects.join(
          ', '
        )} with ${res.data.match.people.map((p) => p.name).join(' and ')} (${
          res.data.id
        }).`
      );
      meetingsCreated.push(meetingId);
      fs.appendFileSync(meetingsCreatedPath, `\n${meetingId}`);
    }
    meetings.push(meeting);
  }
}

importPicktime('./quarantunes-picktime-meetings-feb-1-to-jun-1.csv');
