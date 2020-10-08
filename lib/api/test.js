async function verifyAuth() {
  console.log('Verifying auth...');
  throw new Error('Invalid authentication.');
}

async function verifyBody(req, res) {
  console.log('Verifying req body...');
  return { people: [] };
}

async function fetchUsers(match) {
  console.log('Fetching match people...');
  return match.people;
}

async function timeInAvailability(users) {
  console.log('Verifying time in availability...');
  return false;
}

async function zoomMeeting() {
  console.log('Creating Zoom meeting...');
  return { id: '' };
}

function createMatchPromises(req, res) {
  return verifyAuth()
    .then(() => {
      return verifyBody(req, res);
    })
    .then((match) => {
      return fetchUsers(match);
    })
    .then((users) => {
      return timeInAvailability(users);
    })
    .then(() => {
      return zoomMeeting();
    })
    .catch((err) => {
      console.error('Error occurred:', err);
    });
}

async function createMatchAsync(req, res) {
  try {
    await verifyAuth();
    const match = await verifyBody(req, res);
    const users = await fetchUsers(match);
    await timeslotInAvailability(match.time, users);
    await zoomMeeting(match);
  } catch (e) {
    console.error(`Error occurred: ${e}`);
  }
}

module.exports = createMatchPromises;
