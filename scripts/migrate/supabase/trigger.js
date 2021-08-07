const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { serialize } = require('cookie');
const progress = require('cli-progress');
const Bottleneck = require('bottleneck');

const logger = require('../../lib/logger');
const { auth, client } = require('../../lib/firebase');
const apiDomain = 'http://localhost:3000';

async function getHeaders(uid = '1j0tRKGtpjSX33gLsLnalxvd1Tl2') {
  const token = await auth.createCustomToken(uid);
  await client.auth().signInWithCustomToken(token);
  const jwt = await client.auth().currentUser.getIdToken(true);
  await client.auth().signOut();
  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  const cookie = await auth.createSessionCookie(jwt, { expiresIn });
  return {
    cookie: serialize('session', cookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    }),
  };
}

async function trigger() {
  const headers = await getHeaders();
  logger.verbose(`Headers: ${JSON.stringify(headers)}`);
  const users = require(path.resolve(__dirname, './users.json'));
  const origUsers = require(path.resolve(__dirname, './orig-users.json'));
  logger.info(`Triggering update for ${users.length} users...`);
  const limiter = new Bottleneck({ maxConcurrent: 100, minTime: 500 });
  let count = 0;
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(users.length, count);
  limiter.on('done', () => bar.update((count += 1)));
  limiter.on('failed', async (error, jobInfo) => {
    const { id } = jobInfo.options;
    logger.error(`Job (${id}) failed: ${error}`);
    if (jobInfo.retryCount < 10) {
      logger.verbose(`Retrying job (${id}) in 100ms...`);
      return 100;
    }
  });
  limiter.on('retry', (error, jobInfo) => {
    logger.verbose(`Now retrying job (${jobInfo.options.id})...`);
  });
  await Promise.all(
    users.map((user, idx) =>
      limiter.schedule(
        { id: user.id },
        axios.put,
        `${apiDomain}/api/users/${user.id}`,
        {
          id: user.id,
          name: user.name,
          photo: user.photo || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.bio,
          background: user.background || '',
          venue: user.venue || '',
          socials: user.socials,
          availability: user.availability,
          subjects: user.subjects,
          langs: user.langs,
          visible: user.visible,
          featured: user.featured,
          reference: user.reference,
          timezone: user.timezone || '',
          age: user.age || undefined,
          tags: user.tags,
          created: user.created,
          updated: user.updated,
          verifications: [],
          parents: origUsers[idx].parents,
          roles: [],
          orgs: origUsers[idx].orgs,
        },
        { headers }
      )
    )
  );
  logger.info(`Triggered update for ${users.length} users.`);
}

if (require.main === module) trigger();
