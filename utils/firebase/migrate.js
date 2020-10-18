const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'test';
console.log(`Loading ${env} environment variables...`);
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

const axios = require('axios');
const updateSubjects = require('./update-subjects');
const prompt = require('prompt-sync')();
const progress = require('cli-progress');
const parse = require('csv-parse/lib/sync');
const equal = require('fast-deep-equal');
const { default: to } = require('await-to-js');
const fs = require('fs');
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
const db = app.firestore();
const auth = app.auth();

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

const getSubjects = (id) => {
  return parse(fs.readFileSync(`../algolia/${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  }).filter((subject) => !!subject.name);
};

const users = async () => {
  const mentoringSubjects = getSubjects('mentoring');
  const tutoringSubjects = getSubjects('tutoring');

  const updateLangs = (subjects) => {
    const langs = ['en'];
    for (const subject of subjects) {
      const langCode = SUBJECT_TO_LANG_DICT[subject.replace(' Language', '')];
      if (langCode) langs.push(langCode);
    }
    return langs;
  };

  const updateOrgs = (orgs) => {
    if (!orgs || !(orgs instanceof Array)) return ['default'];
    if (orgs.indexOf('default') < 0) return ['default', ...orgs];
    return orgs;
  };

  const users = (await db.collection('users').get()).docs;
  await Promise.all(
    users.map((user) => {
      const data = user.data();
      const subjects = updateSubjects(data.tutoring.subjects, tutoringSubjects);
      return user.ref.set({
        id: data.uid || user.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        photo: data.photo || '',
        bio: data.bio || '',
        featured: data.featured || [],
        langs: updateLangs(subjects),
        availability: data.availability || [],
        parents: data.parents || [],
        socials: (data.socials || []).filter((s) => !!s.url),
        verifications: data.verifications || [],
        orgs: updateOrgs(data.orgs),
        mentoring: {
          subjects: updateSubjects(data.mentoring.subjects, mentoringSubjects),
          searches: updateSubjects(data.mentoring.searches, mentoringSubjects),
        },
        tutoring: {
          subjects: subjects,
          searches: updateSubjects(data.tutoring.searches, tutoringSubjects),
        },
        visible: false,
      });
    })
  );
};

/**
 * Helper function to trigger an update operation on all of our current `users`
 * documents (which will then be synced with the Algolia search index via our
 * GCP Function).
 *
 * This is useful for when the Algolia search index gets out of sync due to
 * known errors with that GCP Function (e.g. when I forgot to update the Algolia
 * API keys).
 */
const triggerUpdate = async (collectionId = 'users') => {
  const resources = (await db.collection(collectionId).get()).docs;
  await Promise.all(
    resources.map(async (resource) => {
      const original = resource.data();
      await resource.ref.set({ ...original, temp: '' });
      delete original.temp; // Just in case. This shouldn't be in use anyways.
      await resource.ref.set(original);
    })
  );
};

const removeTemp = async (collectionId = 'users') => {
  const resources = (await db.collection(collectionId).get()).docs;
  await Promise.all(
    resources.map(async (resource) => {
      const original = resource.data();
      delete original.temp;
      await resource.ref.set(original);
    })
  );
};

const moveApptsToMatches = async () => {
  const appts = (await db.collection('appts').get()).docs;
  await Promise.all(
    appts.map(async (appt) => {
      const matchRef = db.collection('matches').doc(appt.id);
      const emails = (await appt.ref.collection('emails').get()).docs;
      await Promise.all(
        emails.map(async (email) => {
          await matchRef.collection('emails').doc(email.id).set(email.data());
          await email.ref.delete();
        })
      );
      await matchRef.set(appt.data());
      await appt.ref.delete();
    })
  );
};

const renameAttendeesToPeople = async () => {
  const matches = (await db.collection('matches').get()).docs;
  await Promise.all(
    matches.map(async (match) => {
      const original = match.data();
      const people = original.attendees;
      delete original.attendees;
      await match.ref.set({ ...original, people });
    })
  );
};

const removePAUSDFromDefault = async () => {
  const users = (await db.collection('users').get()).docs;
  await Promise.all(
    users.map(async (user) => {
      const data = user.data();
      const orgs = Array.from(data.orgs || []);
      const idx = orgs.indexOf('default');
      if (
        idx >= 0 &&
        (orgs.includes('woodside') ||
          orgs.includes('pioneer') ||
          orgs.includes('gunn') ||
          orgs.includes('paly') ||
          orgs.includes('jls'))
      )
        orgs.splice(idx, 1);
      if (equal(data.orgs, orgs)) return;
      await user.ref.update({ ...data, orgs });
    })
  );
};

const createUsers = async () => {
  console.log('Fetching users...');
  const users = (await db.collection('users').get()).docs;
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  console.log(`Creating ${users.length} users...`);
  let count = 0;
  bar.start(users.length, count);
  await Promise.all(
    users.map(async (user) => {
      const data = user.data();
      await auth.createUser({
        uid: data.id || user.id,
        email: data.email,
        displayName: data.name,
        phoneNumber: data.phone || undefined,
        photoURL: data.photo || undefined,
      });
      count++;
      bar.update(count);
    })
  );
  console.log(`Created ${users.length} users.`);
};

const createToken = async () => {
  const token = await auth.createCustomToken('1j0tRKGtpjSX33gLsLnalxvd1Tl2');
  await firebase.auth().signInWithCustomToken(token);
  const idToken = await firebase.auth().currentUser.getIdToken(true);
  await firebase.auth().signOut();
  return idToken;
};

const addOrgIdsToUsers = async () => {
  console.log('Fetching orgs...');
  const orgs = (await db.collection('orgs').get()).docs.map((d) => d.id);
  console.log('Fetching users...');
  const users = (await db.collection('users').get()).docs;
  const options = [...orgs, 'delete'];
  const endpoint = 'https://develop.tutorbook.app/api/users';
  const headers = { authorization: `Bearer ${await createToken()}` };
  await Promise.all(
    users.map(async (user) => {
      const data = user.data();
      if (data.orgs && data.orgs.length) return;
      let reply = '';
      while (!options.includes(reply)) {
        const question = `What to do with ${data.name} (${data.email})?`;
        reply = prompt(`${question} (${options.join(', ')}) `);
      }
      if (reply === 'delete') {
        console.log(`Deleting user (${user.id})...`);
        const [err] = await to(
          axios.delete(`${endpoint}/${user.id}`, { headers })
        );
        if (err) console.error(`${err.name} deleting user: ${err.message}`);
      } else {
        const availabilityJSON = (data.availability || []).map((timeslot) => ({
          to: timeslot.to.toDate().toJSON(),
          from: timeslot.from.toDate().toJSON(),
          recur: timeslot.recur,
        }));
        const userJSON = {
          ...data,
          orgs: [reply],
          availability: availabilityJSON,
        };
        console.log(`Saving user (${user.id}) JSON...`, userJSON);
        const [err, res] = await to(
          axios.put(`${endpoint}/${user.id}`, userJSON, { headers })
        );
        if (err) console.error(`${err.name} updating user: ${err.message}`);
      }
    })
  );
};

const addOrgIdToMatches = async () => {
  console.log('Fetching orgs...');
  const orgs = (await db.collection('orgs').get()).docs.map((d) => d.id);
  console.log('Fetching matches...');
  const matches = (await db.collection('matches').get()).docs;
  const endpoint = 'https://develop.tutorbook.app/api/matches';
  const headers = { authorization: `Bearer ${await createToken()}` };
  await Promise.all(
    matches.map(async (match) => {
      const data = match.data();
      let org = '';
      const question =
        `Org for match (${match.id}) \n With subjects ` +
        `(${data.subjects.join(', ')}) \n And people ` +
        `(${data.people.map((p) => p.name || p.id).join(', ')})?`;
      console.log(question);
      while (!orgs.includes(org)) {
        org = prompt(`(${orgs.join(', ')}) `);
      }
      const timesJSON = (data.times || []).map((timeslot) => ({
        to: timeslot.to.toDate().toJSON(),
        from: timeslot.from.toDate().toJSON(),
        recur: timeslot.recur,
      }));
      const venueJSON = {
        ...data.venue,
        created: data.venue.created.toDate().toJSON(),
        updated: data.venue.updated.toDate().toJSON(),
      };
      const matchJSON = {
        ...data,
        org,
        id: match.id,
        venue: venueJSON,
        times: timesJSON,
      };
      const [err] = await to(
        axios.put(`${endpoint}/${match.id}`, matchJSON, { headers })
      );
      if (err)
        console.error(
          `${err.name} updating match (${match.id}): ${err.message}`,
          matchJSON
        );
    })
  );
};

addOrgIdToMatches();
