/**
 * Commandline script that creates new users (both their Firebase Authentication
 * accounts and their corresponding Firestore user documents).
 */

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const phone = require('phone');
const to = require('await-to-js').default;
const readline = require('readline-sync');
const admin = require('firebase-admin');
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
  serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const auth = app.auth();
const firestore = app.firestore();
const partitions = {
  test: firestore.collection('partitions').doc('test'),
  default: firestore.collection('partitions').doc('default'),
};

const USER_FIELDS = [
  'name',
  'email',
  'phone',
  'bio',
  'photo',
  'mentoring.subjects',
  'tutoring.subjects',
  'availability',
];

const PREFILLED_FIELDS = ['availability'];

const ARRAY_FIELDS = ['mentoring.subjects', 'tutoring.subjects'];

const create = async (user = {}, partition = 'default') => {
  PREFILLED_FIELDS.forEach((field) => {
    if (!user[field])
      return console.error(
        '[ERROR] You must pre-fill the' +
          " user's " +
          field +
          ' before running this script.'
      );
  });

  const set = (path, value) => {
    let schema = user;
    const pList = path.split('.');
    let len = pList.length;
    for (let i = 0; i < len - 1; i++) {
      let elem = pList[i];
      if (!schema[elem]) schema[elem] = {};
      schema = schema[elem];
    }
    schema[pList[len - 1]] = value;
  };

  USER_FIELDS.forEach((field) => {
    if (user[field] || PREFILLED_FIELDS.indexOf(field) >= 0) return;
    const value = readline.question("What is the user's " + field + '? ');
    set(field, ARRAY_FIELDS.indexOf(field) < 0 ? value : value.split(', '));
  });
  console.log('[DEBUG] Creating Firebase Authentication account...');
  const [err, res] = await to(
    auth.createUser({
      email: user.email,
      emailVerified: false,
      phoneNumber: phone(user.phone)[0],
      displayName: user.name,
      photoURL: user.photo,
      disabled: false,
    })
  );
  if (err)
    return console.error(
      '[ERROR] Could not create Firebase ' +
        'Authentication account (and skipped creating the Firestore document)' +
        ' b/c of error: ' +
        err.message
    );
  console.log(
    '[DEBUG] Created Firebase Authentication account (' +
      res.uid +
      '). Creating Firestore user document...'
  );
  user.uid = res.uid;
  user.created = user.updated = new Date();
  user.authenticated = true;
  await partitions[partition].collection('users').doc(user.uid).set(user);
  console.log(
    '[INFO] Created Firebase Authentication account and Firestore' +
      ' document for ' +
      user.name +
      ' (' +
      user.uid +
      ').'
  );
};

create(
  {
    availability: [],
  },
  'test'
);
