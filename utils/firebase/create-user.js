const path = require('path');
const to = require('await-to-js').default;
const admin = require('firebase-admin');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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
const db = app.firestore().collection('partitions').doc('test');
const auth = app.auth();

const createUser = async (user, emailVerified = false) => {
  const [err, userRecord] = await to(
    auth.createUser({
      emailVerified,
      disabled: false,
      displayName: user.name,
      photoURL: user.photo ? user.photo : undefined,
      email: user.email,
      phoneNumber: user.phone ? user.phone : undefined,
    })
  );
  if (err) throw new Error(`${err.name} creating user: ${err.message}`);
  await db.collection('users').doc(userRecord.uid).set(user);
};

createUser({
  name: 'John Doe',
  email: 'john.doe@example.org',
  phone: '+16508889345',
  orgs: ['default'],
  availability: {},
  mentoring: { subjects: [], searches: [] },
  tutoring: { subjects: [], searches: [] },
  langs: ['en'],
  parents: [],
  socials: [],
  verifications: [],
  visible: false,
});
