const path = require('path');
const progress = require('cli-progress');
const { dequal } = require('dequal');
const supabase = require('../lib/supabase');
const logger = require('../lib/logger');

const TAGS = ['vetted', 'meeting', 'tutor', 'tutee', 'parent'];

function notTags(tags) {
  return TAGS.filter((t) => !tags.includes(t)).map((t) => `not-${t}`);
}

async function updateUserTags() {
  logger.info('Fetching users...');
  const { data, error } = await supabase.from('users').select();
  if (error) {
    logger.error(`Error fetching users: ${JSON.stringify(error, null, 2)}`);
    debugger;
  }
  logger.info(`Parsing ${data.length} users...`);
  const updated = [];
  data.forEach((u) => {
    let tags = u.tags.filter((t) => TAGS.includes(t));
    if (u.tags.includes('mentor')) tags.push('tutor');
    if (u.tags.includes('mentee')) tags.push('tutee');
    notTags(tags).forEach((t) => tags.push(t));
    if (!dequal(tags, u.tags)) updated.push({ ...u, tags });
  });
  logger.info(`Updating ${updated.length} users...`);
  debugger;
  let count = 0;
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(updated.length, count);
  await Promise.all(
    updated.map(async (u) => {
      const { error } = await supabase.from('users').update(u).eq('id', u.id);
      if (error) {
        logger.error(`Error updating: ${JSON.stringify(error, null, 2)}`);
        debugger;
      }
      bar.update((count += 1));
    })
  );
}

if (require.main === module) updateUserTags();
