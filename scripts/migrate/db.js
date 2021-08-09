const progress = require('cli-progress');
const { dequal } = require('dequal');
const supabase = require('../lib/supabase');
const logger = require('../lib/logger');

const ROLES = ['tutor', 'tutee', 'parent'];

async function updateRoles() {
  logger.info('Fetching people...');
  const { data, error } = await supabase.from('relation_people').select();
  if (error) {
    logger.error(`Error fetching people: ${JSON.stringify(error, null, 2)}`);
    debugger;
  }
  logger.info(`Parsing ${data.length} people...`);
  const updated = [];
  data.forEach((p) => {
    const roles = p.roles.filter((r) => ROLES.includes(r));
    if (p.roles.includes('mentor')) roles.push('tutor');
    if (p.roles.includes('mentee')) roles.push('tutee');
    if (!dequal(roles, p.roles)) updated.push({ original: p, roles });
  });
  logger.info(`Updating ${updated.length} people...`);
  debugger;
  let count = 0;
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(updated.length, count);
  await Promise.all(
    updated.map(async (p) => {
      const { error } = await supabase
        .from('relation_people')
        .update({ ...p.original, roles: p.roles })
        .eq('meeting', p.original.meeting)
        .eq('user', p.original.user)
        .eq('roles', `{${p.original.roles}}`);
      if (error) {
        logger.error(`Error updating: ${JSON.stringify(error, null, 2)}`);
        debugger;
      }
      bar.update((count += 1));
    })
  );
}

if (require.main === module) updateRoles();
