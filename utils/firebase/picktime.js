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
  level: 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'picktime.log', level: 'debug' }),
  ],
});

const env = 'production';
const apiDomain = 'https://tutorbook.app';
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
  if (email && phone) {
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
    debugger;
    const [err, res] = await to(axios.post(`${apiDomain}/api/users`, user));
    if (err) {
      logger.error(`${err.name} creating user: ${err.message}`);
      debugger;
      return user;
    } else {
      logger.debug(`Created ${res.data.name} (${res.data.id}).`);
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
  let bio = '';
  if (row[fields.experience])
    bio += `Experience with ${subject}: ${row[fields.experience]}\n`;
  if (row[fields.city]) bio += `Currently located in: ${row[fields.city]}\n`;
  if (row[fields.age]) bio += `Age: ${row[fields.age]}\n`;
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
 * @param {number} duration - The meeting duration in mins (default to 30mins).
 * @return {Timeslot} - The timeslot in JSON-friendly format.
 */
function getMeetingTime(dateStr, duration = 30) {
  const [date, mo, yr, time, ampm] = dateStr.replace(',', '').split(' ');
  const monthIdx = ['Jan', 'Feb', 'Mar', 'Apr', 'May'].indexOf(mo);
  const [hrsStr, minsStr] = time.split(':');
  const hrs = Number(hrsStr) + (ampm === 'PM' ? 12 : 0);
  const mins = Number(minsStr);
  const start = new Date(yr, monthIdx, date, hrs, mins);
  const end = new Date(start.valueOf() + duration * 60 * 1000);
  return { id: nanoid(), recur: '', from: start.toJSON(), to: end.toJSON() };
}

async function convertPicktimeRow(row) {
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
  };
  logger.silly(`Generated match: ${JSON.stringify(match, null, 2)}`);
  const venueId = nanoid(10);
  const meeting = {
    match,
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
    },
    time: getMeetingTime(row[fields.date]),
    notes: generateMeetingNotes(row),
  };
  logger.silly(`Generated meeting: ${JSON.stringify(meeting, null, 2)}`);
  logger.debug(`Creating meeting: ${JSON.stringify(meeting, null, 2)}`);
  // TODO: Call API to create the meeting. Note that, right now, those requests
  // will fail as I have to change the meeting and match creator to be an admin.
  // Note: Creating meetings will send emails to the meeting people.
  return meeting;
}

async function importPicktime(path) {
  const meetings = [];
  const parser = fs.createReadStream(path).pipe(
    parse({
      skip_empty_lines: true,
      columns: true,
    })
  );
  for await (const record of parser) {
    const meeting = await convertPicktimeRow(record);
    meetings.push(meeting);
  }
}

importPicktime('./quarantunes-picktime-meetings.csv');
