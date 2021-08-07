const path = require('path');
const progress = require('cli-progress');
const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

async function addMentoringSubjects() {
  const users = require(path.resolve(__dirname, './orig-users.json'));
  logger.info(`Parsing ${users.length} users...`);
  const updated = users
    .map((u) => {
      const subjects = new Set();
      u.mentoring.subjects.forEach((s) => subjects.add(s));
      u.tutoring.subjects.forEach((s) => subjects.add(s));
      return { id: u.id, subjects: [...subjects] };
    })
    .filter((u) => !!u.subjects.length);
  logger.info(`Updating ${updated.length} user rows...`);
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

if (require.main === module) addMentoringSubjects();
