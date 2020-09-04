const path = require('path');
const to = require('await-to-js').default;
const admin = require('firebase-admin');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.production'),
});

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
const db = app.firestore();
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
  name: 'Lisa Collart',
  email: 'lcollart@pausd.org',
  phone: '+16503548271',
  orgs: ['default', 'gunn'],
  availability: {},
  mentoring: { subjects: [], searches: [] },
  tutoring: {
    subjects: [
      'Math',
      'Algebra',
      'Geometry',
      'Trigonometry',
      'Analysis',
      'Statistics',
    ],
    searches: [],
  },
  langs: ['en'],
  parents: [],
  socials: [
    {
      type: 'linkedin',
      url: 'https://www.linkedin.com/in/lisa-collart-6203745a/',
    },
  ],
  verifications: [],
  visible: true,
});
