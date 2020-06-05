const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const axios = require('axios');
const utils = require('./utils.js');
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
const auth = app.auth();

const BIOS = [
  `I’m a fifth-year electrical engineering Ph.D. student at Stanford University interested in systems, networking, and security. While an undergraduate, I focused on digital systems and embedded hardware and software. Now, I work with Phil Levis and Keith Winstein doing systems and networking research.`,
  `I'm an Associate Professor in the Computer Science and Electrical Engineering Departments of Stanford University. I head the Stanford Information Networking Group (SING) and co-direct lab64, the EE maker space at Stanford. I co-directed the Secure Internet of Things Project. I research operating systems, networks, and software design, especially for embedded systems. I appreciate excellent engineering and have a self-destructive aversion to low hanging fruit.`,
  `Sophomore at Gunn High School interested in artificial intelligence, progressive web development, karate, cello, photography, filmmaking, music, and running.`,
  `Keith Winstein is an assistant professor of computer science and, by courtesy, of electrical engineering at Stanford University. His research group designs networked systems that cross traditional abstraction boundaries, using statistical and functional techniques. He and his colleagues made the Mosh (mobile shell) tool, the Sprout and Remy systems for computer-generated congestion control, the Mahimahi network emulator, the Lepton JPEG-recompression tool, the ExCamera and Salsify systems for low-latency video coding and lambda computing, the Guardian Agent for secure delegation across a network, and the Pantheon of Congestion Control.Keith Winstein is an assistant professor of computer science and, by courtesy, of electrical engineering at Stanford University.`,
];
const TUTORING_SUBJECTS = [
  'AP Biology',
  'Biology Honors',
  'Algebra 1',
  'Trigonometry Honors',
  'AP Calculus BC',
  'SAT Chemistry',
];
const MENTORING_SUBJECTS = ['Advertising', 'Marketing', 'Computer Science'];

const getRand = (arr, num) => {
  const res = [];
  while (res.length < num) {
    let randItem = arr[Math.floor(Math.random() * arr.length)];
    while (res.indexOf(randItem) >= 0) {
      randItem = arr[Math.floor(Math.random() * arr.length)];
    }
    res.push(randItem);
  }
  return res;
};
const getRandTutoringSubjects = () => getRand(TUTORING_SUBJECTS, 3);
const getRandMentoringSubjects = () => getRand(MENTORING_SUBJECTS, 3);
const getRandAvailability = () => {
  return [
    { from: utils.getDate(0, 9), to: utils.getDate(0, 11) },
    { from: utils.getDate(1, 9), to: utils.getDate(1, 11) },
    { from: utils.getDate(3, 12), to: utils.getDate(3, 22) },
    { from: utils.getDate(5, 6), to: utils.getDate(5, 14) },
  ];
};

const main = async () => {
  const res = await axios({
    method: 'get',
    url: 'https://randomuser.me/api/',
    responseType: 'json',
    params: {
      results: 30,
    },
  });
  const users = res.data.results.map((user) => ({
    name: `${user.name.first} ${user.name.last}`,
    email: user.email,
    phone: user.phone,
    photo: user.picture.large,
    tutoring: {
      subjects: getRandTutoringSubjects(),
      searches: getRandTutoringSubjects(),
    },
    mentoring: {
      subjects: getRandMentoringSubjects(),
      searches: getRandMentoringSubjects(),
    },
    availability: getRandAvailability(),
    bio: getRand(BIOS, 1)[0],
    socials: [
      {
        type: 'github',
        url: 'https://github.com/nicholaschiang',
      },
      {
        type: 'website',
        url: 'https://nicholaschiang.com',
      },
      {
        type: 'linkedin',
        url: 'https://linkedin.com/in/nicholaschiang',
      },
      {
        type: 'twitter',
        url: 'https://twitter.com/nicholaschiang',
      },
      {
        type: 'facebook',
        url: 'https://facebook.com/nicholaschiang',
      },
      {
        type: 'instagram',
        url: 'https://instagram.com/nicholaschiang',
      },
    ],
  }));
  await Promise.all(
    users.map(async (user) => {
      const userRecord = await auth.createUser({
        displayName: user.name,
        photoURL: user.photo,
        email: user.email,
        emailVerified: true,
      });
      user.uid = userRecord.uid;
      await db.collection('users').doc(user.uid).set(user);
    })
  );
};

main();
