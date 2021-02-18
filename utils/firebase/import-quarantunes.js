const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'test';
console.log(`Loading ${env} environment variables...`);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}.local`) });

console.log(
  'Using Firebase configuration:',
  JSON.stringify(
    {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    },
    null,
    2
  )
);

const { v4: uuid } = require('uuid');
const { default: to } = require('await-to-js');
const parse = require('csv-parse/lib/sync');
const progress = require('cli-progress');
const mime = require('mime-types');
const axios = require('axios');
const phone = require('phone');
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
const auth = app.auth();
const db = app.firestore();
const bucket = app.storage().bucket();

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

const CSVToArray = require('./csv-to-array');
const updateSubjects = require('./update-subjects');

// TODO: Figure out a way to request the original quality from Wix instead of
// a 500x500 version of the photo. This will also impose some bad cropping.
function getPhotoURL(photo, width = 500, height = 500) {
  const id = photo.split('/').pop();
  const size = `w_${width},h_${height}`;
  return `https://static.wixstatic.com/media/${id}/v1/fill/${size}/${id}`;
}

async function downloadFile(url, filename = uuid()) {
  if (url === 'https://tutorbook.app/app/img/male.png') return './male.png';
  if (url === 'https://tutorbook.app/app/img/female.png') return './female.png';
  if (url === 'https://tutorbook.app/app/img/loading.gif') return './male.png';
  const [err, res] = await to(axios.get(url, { responseType: 'stream' }));
  if (err) {
    console.error(`${err.name} fetching (${url}): ${err.message}`);
    return './male.png';
  }
  const extension = mime.extension(res.headers['content-type']);
  const path = `./temp/${filename}.${extension}`;
  const stream = res.data.pipe(fs.createWriteStream(path));
  return new Promise((resolve) => stream.on('finish', () => resolve(path)));
}

function uploadFile(
  filename,
  destination = `temp/${uuid()}.${filename.split('.').pop()}`
) {
  const uid = uuid();
  return bucket
    .upload(filename, {
      destination,
      uploadType: 'media',
      metadata: {
        contentType: mime.contentType(filename.split('/').pop()),
        metadata: { firebaseStorageDownloadTokens: uid },
      },
    })
    .then((data) => {
      const file = data[0];
      const url =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
        `${encodeURIComponent(file.name)}?alt=media&token=${uid}`;
      return Promise.resolve(url);
    });
}

function period(str) {
  if (!str || str.endsWith('.') || str.endsWith('!')) return str;
  return `${str}.`;
}

function getSubjects(id) {
  return parse(fs.readFileSync(`../algolia/${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  }).filter((subject) => !!subject.name);
}

function getUsers() {
  console.log(`Fetching user CSV rows...`);
  const rows = CSVToArray(fs.readFileSync('./quarantunes-latest.csv'));
  console.log(`Fetching mentoring subjects...`);
  const subjects = getSubjects('mentoring');
  rows.shift();
  console.log(`Converting ${rows.length} users...`);
  return rows.map((row) => {
    const [
      _,
      first,
      last,
      email,
      phoneNumber,
      resume,
      instruments,
      experience,
      source,
      city,
      bio,
      photo,
      availability,
      classes,
      start,
      id,
      owner,
      created,
      updated,
    ] = row;
    return {
      id: '',
      name: `${first} ${last}`,
      email: email || '',
      phone: phone(phoneNumber)[0] || '',
      background: '',
      photo: photo ? getPhotoURL(photo) : '',
      bio:
        (bio ? period(bio) : '') +
        (experience ? ` ${period(experience)}` : '') +
        (city ? ` Currently living in ${period(city)}` : '') +
        (availability ? ` Available ${period(availability)}` : ''),
      socials: !resume
        ? []
        : [
            {
              type: 'website',
              url: resume,
            },
          ],
      orgs: ['quarantunes'],
      zooms: [],
      availability: [],
      mentoring: {
        subjects: updateSubjects(
          [...(instruments || '').split(', '), ...(classes || '').split(', ')],
          subjects
        ),
        searches: [],
      },
      tutoring: { subjects: [], searches: [] },
      langs: ['en'],
      parents: [],
      verifications: [],
      visible: true,
      featured: [],
      roles: [],
    };
  });
}

async function createUser(user) {
  const endpoint = 'https://develop.tutorbook.app/api/users';
  const [err] = await to(axios.post(endpoint, user));
  if (err) {
    console.log(
      `\n\n${err.name} creating user (${user.name} <${user.email}>): ${
        (err.response || {}).data || err.message
      }\n`
    );
    debugger;
  }
}

const createToken = async () => {
  const token = await auth.createCustomToken('1j0tRKGtpjSX33gLsLnalxvd1Tl2');
  await firebase.auth().signInWithCustomToken(token);
  const idToken = await firebase.auth().currentUser.getIdToken(true);
  await firebase.auth().signOut();
  return idToken;
};

const convertToUserJSON = (userData) => {
  const availability = (userData.availability || []).map((timeslot) => ({
    to: timeslot.to.toDate().toJSON(),
    from: timeslot.from.toDate().toJSON(),
  }));
  return { ...userData, availability };
};

async function updateUser(updated) {
  const endpoint = 'https://develop.tutorbook.app/api/users';
  const headers = { authorization: `Bearer ${await createToken()}` };

  console.log(`Fetching user (${updated.id})...`);

  const data = (await db.collection('users').doc(updated.id).get()).data();
  const user = {
    background: '',
    roles: [],
    ...convertToUserJSON(data),
    ...updated,
  };

  console.log(`Updating user (${user.name})...`, user);

  const [err] = await to(
    axios.put(`${endpoint}/${updated.id}`, user, { headers })
  );
  if (err) {
    console.error(`${err.name} updating user (${user.name}): ${err.message}`);
    debugger;
  }
}

async function importQuarantunes() {
  const users = getUsers();
  console.log(`Creating ${users.length} users...`);
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(users.length, 0);
  let count = 0;
  await Promise.all(
    users.map(async (user) => {
      await createUser(user);
      count++;
      bar.update(count);
    })
  );
}

async function verifyImport() {
  const users = getUsers();
  console.log(`Verifying ${users.length} users exist...`);
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(users.length, 0);
  let count = 0;
  for (const user of users) {
    const create = async (data) => {
      console.log(`Creating user (${data.name} <${data.email}>)...`);
      await createUser(data);
      console.log(`Created user (${data.name} <${data.email}>).`);
    };
    const update = (data) => updateUser(data);
    const { docs } = await db
      .collection('users')
      .where('email', '==', (user.email || '').toLowerCase())
      .get();
    if (!user.email) {
      console.error(`\nUser (${user.name}) missing email.`);
      console.log('User:', JSON.stringify(user, null, 2));
      debugger;
    } else if (docs.length !== 1) {
      console.error(`\n${docs.length} docs with email (${user.email}).`);
      console.log('User:', JSON.stringify(user, null, 2));
      debugger;
    } else if (!(docs[0].data().orgs || []).includes('quarantunes')) {
      console.error(`\nUser (${user.name} <${user.email}>) missing org.`);
      console.log('User:', JSON.stringify(user, null, 2));
      const data = docs[0].data();
      console.log('Data:', JSON.stringify(data, null, 2));
      debugger;
    }
    count++;
    bar.update(count);
  }
}

verifyImport();
