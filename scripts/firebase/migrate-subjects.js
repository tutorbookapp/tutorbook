async function createToken(uid = '1j0tRKGtpjSX33gLsLnalxvd1Tl2') {
  const token = await auth.createCustomToken(uid);
  await firebase.auth().signInWithCustomToken(token);
  const idToken = await firebase.auth().currentUser.getIdToken(true);
  await firebase.auth().signOut();
  return idToken;
}

async function migrateAspect(org, prev, next) {
  const headers = { authorization: `Bearer ${await createToken()}` };
  const orgs = JSON.stringify([{ label: 'QuaranTunes', value: 'quarantunes' }]);
  const queryURL = `/api/users?orgs=${encodeURIComponent(orgs)}`;
  const res = await axios.get(queryURL, { headers });
  await Promise.all(
    res.users.map(async (user) => {
      const updated = {
        ...user,
        [prev]: { subjects: [], searches: [] },
        [next]: {
          subjects: [...user[next].subjects, ...user[prev].subjects],
          searches: [...user[next].searches, ...user[prev].searches],
        },
      };
      await axios.put(`/api/users/${updated.id}`, updated, { headers });
    })
  );
}

migrateAspect('quarantunes', 'mentoring', 'tutoring');
