// Script to migrate data from the old Tutorbook web app data structure and
// Firebase project to the new one (this one).

const path = require('path');
const fs = require('fs');

const { default: to } = require('await-to-js');

const updateSubjects = require('./update-subjects');
const parse = require('csv-parse/lib/sync');
const progress = require('cli-progress');
const mime = require('mime-types');
const uuid = require('uuid').v4;
const axios = require('axios');
const phone = require('phone');

const admin = require('firebase-admin');
const serviceAccount = require('./old-admin.json');
const oldApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    projectId: 'tutorbook-779d8',
    storageBucket: 'tutorbook-779d8.appspot.com',
    databaseURL: 'https://tutorbook-779d8.firebaseio.com',
  },
  'old'
);

const oldFirestore = oldApp.firestore();
oldFirestore.settings({ ignoreUndefinedProperties: true });
const oldDB = oldFirestore.collection('partitions').doc('default');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.production'),
});

const newApp = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },
  'new'
);

const newDB = newApp.firestore();
newDB.settings({ ignoreUndefinedProperties: true });
const newBucket = newApp.storage().bucket();
const newAuth = newApp.auth();

async function doesUserExist(user) {
  if (!user.email) return false;
  const [err, userRecord] = await to(newAuth.getUserByEmail(user.email));
  if (err) return false;
  return true;
}

async function createUser(user, emailVerified = false) {
  const [err, userRecord] = await to(
    newAuth.createUser({
      emailVerified,
      disabled: false,
      displayName: user.name,
      photoURL: user.photo ? user.photo : undefined,
      email: user.email,
      phoneNumber: user.phone ? user.phone : undefined,
    })
  );
  if (err && err.code === 'auth/email-already-exists') return;
  if (err) throw new Error(`${err.name} creating user: ${err.message}`);
  await newDB.collection('users').doc(userRecord.uid).set(user);
}

function getSubjects(id) {
  return parse(fs.readFileSync(`../algolia/${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  }).filter((subject) => !!subject.name);
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
  return newBucket
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
        `https://firebasestorage.googleapis.com/v0/b/${newBucket.name}/o/` +
        `${encodeURIComponent(file.name)}?alt=media&token=${uid}`;
      return Promise.resolve(url);
    });
}

async function migrate() {
  console.log('Fetching user documents...');
  const validSubjects = [
    ...getSubjects('tutoring'),
    ...getSubjects('mentoring'),
  ];
  const users = (await oldDB.collection('users').get()).docs;
  console.log(`Fetched ${users.length} user documents. Processing...`);
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(users.length, 0);
  let count = 0;
  await Promise.all(
    users.map(async (userDoc) => {
      const user = userDoc.data();
      if (await doesUserExist(user)) {
        count += 1;
        bar.update(count);
        return;
      }
      try {
        if (!user.name || !user.email) throw new Error('No name or email.');
        const orgs = new Set(['default']);
        (user.locations || []).forEach((location) => {
          switch (location) {
            case 'Paly Peer Tutoring Center':
              orgs.add('paly');
              break;
            case 'Gunn Academic Center':
              orgs.add('gunn');
              break;
            case 'JLS Library':
              orgs.add('jls');
              break;
            case 'Pioneer High School':
              orgs.add('pioneer');
              break;
            case 'Woodside Tutoring Den':
              orgs.add('woodside');
              break;
            default:
              orgs.add('default');
              break;
          }
        });
        const subjects = updateSubjects(user.subjects || [], validSubjects);
        const updated = {
          name: user.name,
          email: user.email,
          phone: phone(user.phone)[0],
          photo: user.photo
            ? await downloadFile(user.photo).then((p) => uploadFile(p))
            : '',
          bio: user.bio,
          socials: [],
          orgs: [...orgs],
          availability: [],
          mentoring: { subjects: [], searches: [] },
          tutoring: {
            subjects: user.type !== 'Pupil' ? subjects : [],
            searches: user.type === 'Pupil' ? subjects : [],
          },
          langs: ['en'],
          parents: [],
          verifications: [],
          visible: !!(user.config || {}).showProfile,
        };
        await createUser(updated);
      } catch (error) {
        console.error(`${error.name} processing user (${userDoc.id}):`, error);
        debugger;
      }
      count += 1;
      bar.update(count);
    })
  );
  bar.stop();
  console.log(`Processed ${users.length} user documents. Migration complete.`);
}

migrate();
