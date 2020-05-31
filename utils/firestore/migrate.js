const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env.prod') });

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
const db = app.firestore().collection('partitions').doc('test');

const main = async () => {
  const users = (await db.collection('users').get()).docs;
  await Promise.all(
    users.map((user) => {
      const data = {
        ...(user.data() || {}),
        mentoring: {
          subjects: user.data().expertise || [],
          searches: [],
        },
        tutoring: {
          subjects: user.data().subjects || [],
          searches: user.data().searches || [],
        },
      };
      delete data.subjects;
      delete data.searches;
      delete data.expertise;
      delete data.notifications;
      delete data.schedule;
      return user.ref.set(data);
    })
  );
};

main();
