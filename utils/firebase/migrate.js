const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const updateSubjects = require('./update-subjects');
const parse = require('csv-parse/lib/sync');
const equal = require('fast-deep-equal');
const fs = require('fs');
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
const db = app.firestore();

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

const removePartition = async (partitionId = 'default', dryRun = false) => {
  const partition = db.collection('partitions').doc(partitionId);
  const [users, requests, matches] = await Promise.all([
    partition.collection('users').get(),
    partition.collection('requests').get(),
    partition.collection('matches').get(),
  ]);
  const updateUsers = users.map(async (user) => {
    await db.collection('users').doc(user.id).set(user.data());
  });
  const updateRequests = requests.map(async (request) => {
    const doc = db.collection('requests').doc(request.id);
    await doc.set(request.data());
    const emails = (await request.ref.collection('emails').get()).docs;
    await Promise.all(
      emails.map(async (email) => {
        await doc.collection('emails').doc(email.id).set(email.data());
      })
    );
  });
  const updateMatches = matches.map(async (match) => {
    const doc = db.collection('matches').doc(match.id);
    await doc.set(match.data());
    const emails = (await match.ref.collection('emails').get()).docs;
    await Promise.all(
      emails.map(async (email) => {
        await doc.collection('emails').doc(email.id).set(email.data());
      })
    );
  });
  await Promise.all([updateUsers, updateRequests, updateMatches]);
  if (!dryRun) await partition.delete();
};

removePartition('test', true);
