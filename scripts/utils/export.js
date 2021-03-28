const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env.prod') });

const fs = require('fs');
const admin = require('firebase-admin');
const stringify = require('csv-stringify/lib/sync');
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
const db = app.firestore().collection('partitions').doc('default');

const main = async () => {
  const users = (await db.collection('users').get()).docs.map((d) => d.data());
  const header = [
    ['uid', 'name', 'email', 'phone', 'bio', 'socials', 'subjects', 'searches'],
  ];
  const rows = users.map((user) => [
    user.uid,
    user.name,
    user.email,
    user.phone,
    user.bio,
    (user.socials || []).map((s) => s.url).join('; '),
    ((user.subjects || {}).explicit || []).join('; '),
    ((user.searches || {}).explicit || []).join('; '),
  ]);
  debugger;
  fs.writeFileSync('users.csv', stringify(header.concat(rows)));
};

main();
