// Script to migrate data from the old Tutorbook web app data structure and
// Firebase project to the new one (this one).

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const parse = require('csv-parse/lib/sync');
const mime = require('mime-types');
const uuid = require('uuid').v4;
const axios = require('axios');
const phone = require('phone');
const fs = require('fs');

const { updateSubjects } = require('./migrate');

const admin = require('firebase-admin');
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

const oldDB = oldApp.firestore().collection('partitions').doc('default');
const newDB = newApp.firestore().collection('partitions').doc('test');

const bucket = oldApp.storage().bucket();

function getSubjects(id) {
  return parse(fs.readFileSync(`../algolia/${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  }).filter((subject) => !!subject.name);
}

function downloadFile(
  url,
  filename = `./temp/${url.split('/').pop().split('.').shift()}`
) {
  return axios.get(url, { responseType: 'stream' }).then((res) => {
    const extension = mime.extension(res.headers['content-type']);
    const path = `${filename}.${extension}`;
    res.data.pipe(fs.createWriteStream(path));
    return Promise.resolve(path);
  });
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

async function migrate() {
  const validSubjects = [
    ...getSubjects('tutoring'),
    ...getSubjects('mentoring'),
  ];
  const users = (await oldDB.collection('users').get()).docs;
  debugger;
  await Promise.all(
    users.map(async (userDoc) => {
      try {
        const user = userDoc.data();
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
          photo: await downloadFile(user.photo).then((p) => uploadFile(p)),
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
        debugger;
      } catch (error) {
        console.error(`${error.name} processing user (${userDoc.id}):`, error);
        debugger;
      }
    })
  );
}

migrate();
