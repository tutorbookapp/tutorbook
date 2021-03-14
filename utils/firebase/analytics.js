const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'production';
console.log(`Loading ${env} environment variables...`);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
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

const fs = require('fs');
const clone = require('rfdc')();
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

/**
 * Script that creates the analytics documents for org activity by:
 * 1. Fetching all org users, meetings, and matches.
 * 2. Updating the tags on all of those resources.
 * 3. Iterating over those resources, trying to add to existing analytics doc
 *    (within 24 hours of resource create timestamp). If we can't, create a new
 *    analytics doc and insert it into the growing timeline.
 * 4. Uploading the created timeline to Firestore.
 */
async function main(orgId, dryRun = false) {
  console.log(`Fetching (${orgId}) data...`);
  const [usersData, matchesData] = await Promise.all([
    db.collection('users').where('orgs', 'array-contains', orgId).get(),
    db.collection('matches').where('org', '==', orgId).get(),
  ]);

  console.log('Updating tags...');
  const users = usersData.docs
    .map((doc) => {
      const user = { tags: [], ...doc.data() };
      const created = doc.createTime ? doc.createTime.toDate() : new Date();
      const updated = doc.updateTime ? doc.updateTime.toDate() : new Date();
      const tags = [];
      if (user.mentoring.subjects.length || user.tags.includes('mentor'))
        tags.push('mentor');
      if (user.mentoring.searches.length || user.tags.includes('mentee'))
        tags.push('mentee');
      if (user.tutoring.subjects.length || user.tags.includes('tutor'))
        tags.push('tutor');
      if (user.tutoring.searches.length || user.tags.includes('tutee'))
        tags.push('tutee');
      if (user.verifications.length) tags.push('vetted');
      return { ...user, created, updated, tags };
    })
    .sort((a, b) => a.created - b.created);
  const matches = matchesData.docs
    .map((doc) => {
      // TODO: Once I implement the tag updating API logic, add it here as well.
      const match = doc.data();
      const created = doc.createTime ? doc.createTime.toDate() : new Date();
      const updated = doc.updateTime ? doc.updateTime.toDate() : new Date();
      return { ...match, created, updated, tags: [] };
    })
    .sort((a, b) => a.created - b.created);

  console.log('Creating timeline...');
  const timeline = [];
  const empty = {
    mentor: { total: 0, vetted: 0, matched: 0, meeting: 0 },
    mentee: { total: 0, vetted: 0, matched: 0, meeting: 0 },
    tutor: { total: 0, vetted: 0, matched: 0, meeting: 0 },
    tutee: { total: 0, vetted: 0, matched: 0, meeting: 0 },
    match: { total: 0, meeting: 0 },
    meeting: { total: 0, recurring: 0 },
  };

  function isRole(role) {
    if (typeof role !== 'string') return false;
    return ['tutor', 'tutee', 'mentor', 'mentee'].includes(role);
  }

  function updateTags(key, nums, tags) {
    nums[key].total += 1;
    tags.forEach((tag) => {
      if (!isRole(tag)) nums[key][tag] += 1;
    });
  }

  console.log(`Adding ${users.length} users to timeline...`);
  users.forEach((user) => {
    const existing = timeline.find(
      (nums) => nums.date.valueOf() >= user.created.valueOf() - 864e5
    );
    if (existing) {
      user.tags.forEach((role) => {
        if (isRole(role)) updateTags(role, existing, user.tags);
      });
    } else {
      const latest = clone(timeline[timeline.length - 1] || empty);
      user.tags.forEach((role) => {
        if (isRole(role)) updateTags(role, latest, user.tags);
      });
      latest.date = user.created;
      timeline.push(latest);
    }
  });

  console.log(`Adding ${matches.length} matches to timeline...`);
  matches.forEach((match, idx) => {
    const existing = timeline.find(
      (nums) => nums.date.valueOf() >= match.created.valueOf() - 864e5
    );
    let current;
    if (existing) {
      updateTags('match', existing, match.tags);
      current = existing.match;
    } else {
      const latest = clone(timeline[timeline.length - 1] || empty);
      updateTags('match', latest, match.tags);
      latest.date = match.created;
      timeline.push(latest);
      current = latest.match;
    }
    if (idx === matches.length - 1) {
      // Ensure that the timeline numbers following the last match include the
      // latest match numbers.
      timeline
        .filter(
          (nums) => nums.date.valueOf() >= match.created.valueOf() - 864e5
        )
        .forEach((nums) => {
          nums.match = current;
        });
    }
  });

  console.log('Writing timeline to JSON...');
  fs.writeFileSync('./timeline.json', JSON.stringify(timeline, null, 2));

  if (dryRun) return;

  console.log(`Creating ${timeline.length} database records...`);
  await Promise.all(
    timeline.map(async (nums) => {
      const ref = db
        .collection('orgs')
        .doc(orgId)
        .collection('analytics')
        .doc();
      nums.created = nums.updated = new Date();
      nums.id = ref.id;
      await ref.set(nums);
    })
  );
}

main('quarantunes');
