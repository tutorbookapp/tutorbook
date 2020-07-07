const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const parse = require('csv-parse/lib/sync');
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
const db = app.firestore().collection('partitions').doc('test');

const getSubjects = (id) => {
  return parse(fs.readFileSync(`../algolia/${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  }).filter((subject) => !!subject.name);
};

const SUBJECT_TO_LANG_DICT = {
  Latin: 'la',
  Spanish: 'es',
  Chinese: 'zh',
  Urdu: 'ur',
  Hindi: 'hi',
  Japanese: 'ja',
  French: 'fr',
  German: 'de',
};
const GRADES = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

const SUBJECT_LEVELS = ['1', '2', '3', '4'];

const users = async () => {
  const mentoringSubjects = getSubjects('mentoring');
  const tutoringSubjects = getSubjects('tutoring');

  const updateSubjects = (subjects, validSubjects) => {
    const all = subjects.map((subject) => {
      const idx = validSubjects.findIndex((s) => {
        if (s.name === subject) return true;
        const synonyms = s.synonyms.split(', ');
        if (synonyms.indexOf(subject) >= 0) return true;
        for (const grade of GRADES) {
          const subjectWithoutGrade = subject.replace(grade + ' ', '');
          if (s.name === subjectWithoutGrade) return true;
          if (synonyms.indexOf(subjectWithoutGrade) >= 0) return true;
        }
        for (const subjectLevel of SUBJECT_LEVELS) {
          const subjectWithoutLevel = subject.replace(' ' + subjectLevel, '');
          if (s.name === subjectWithoutLevel) return true;
          if (synonyms.indexOf(subjectWithoutLevel) >= 0) return true;
        }
        return false;
      });
      if (idx < 0) {
        console.log(`[DEBUG] Subject "${subject}" could not be found.`);
        debugger;
      }
      return idx >= 0 ? validSubjects[idx].name : subject;
    });
    return [...new Set(all)];
  };

  const updateLangs = (subjects) => {
    const langs = ['en'];
    for (const subject of subjects) {
      const langCode = SUBJECT_TO_LANG_DICT[subject.replace(' Language', '')];
      if (langCode) langs.push(langCode);
    }
    return langs;
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

const updateAppt = (apptDoc) => {
  const appt = apptDoc.data();
  return apptDoc.ref.set({
    ...appt,
    attendees: appt.attendees.map((a) => ({ id: a.uid, roles: a.roles })),
  });
};

const appts = async () => {
  const users = (await db.collection('users').get()).docs;
  await Promise.all(
    users.map(async (user) => {
      const requests = (await user.ref.collection('requests').get()).docs;
      const appts = (await user.ref.collection('appts').get()).docs;
      await Promise.all(requests.map((request) => updateAppt(request)));
      await Promise.all(appts.map((appt) => updateAppt(appt)));
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
const triggerUsersUpdate = async () => {
  const users = (await db.collection('users').get()).docs;
  await Promise.all(
    users.map(async (user) => {
      const original = user.data();
      const updated = { ...original, bio: original.bio + ' ' };
      await user.ref.update(updated);
      await user.ref.update(original);
    })
  );
};

triggerUsersUpdate();
