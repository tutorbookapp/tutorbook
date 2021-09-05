const dev = require('./supabase')('development');
const prod = require('./supabase')('production');
const logger = require('./lib/logger');

// I'm not allowed to insert into the `meetings` ID column because it's set to
// always be generated as a `bigint`. So, I have to map all the original IDs to
// the created IDs to be used when I'm creating the `relation_people` table.
const meetingIds = {};

async function copyMeetings() {
  const table = 'meetings';
  logger.info(`Selecting ${table} from production...`);
  const { data, error } = await prod.from(table).select();
  if (error) {
    logger.error(`Error selecting ${table}: ${error.message}`);
    debugger;
  } else if (!data) {
    logger.error(`Missing data: ${data}`);
    debugger;
  } else {
    logger.info(`Inserting ${data.length} ${table} into development...`);
    const originalIds = data.map((d) => d.id);
    data.forEach((d) => {
      delete d.id;
    });
    const { data: inserted, error } = await dev.from(table).insert(data);
    if (error) {
      logger.error(`Error inserting ${table}: ${error.message}`);
      debugger;
    }
    originalIds.forEach((id, idx) => {
      meetingIds[id] = inserted[idx].id;
    });
  }
}

async function copyPeople() {
  const table = 'relation_people';
  logger.info(`Selecting ${table} from production...`);
  const { data, error } = await prod.from(table).select();
  if (error) {
    logger.error(`Error selecting ${table}: ${error.message}`);
    debugger;
  } else if (!data) {
    logger.error(`Missing data: ${data}`);
    debugger;
  } else {
    logger.info(`Inserting ${data.length} ${table} into development...`);
    const { error } = await dev
      .from(table)
      .insert(data.map((d) => ({ ...d, meeting: meetingIds[d.meeting] })));
    if (error) {
      logger.error(`Error inserting ${table}: ${error.message}`);
      debugger;
    }
  }
}

async function copy(table = 'users') {
  logger.info(`Selecting ${table} from production...`);
  const { data, error } = await prod.from(table).select();
  if (error) {
    logger.error(`Error selecting ${table}: ${error.message}`);
    debugger;
  } else if (!data) {
    logger.error(`Missing data: ${data}`);
    debugger;
  } else {
    logger.info(`Inserting ${data.length} ${table} into development...`);
    const { error } = await dev.from(table).insert(data);
    if (error) {
      logger.error(`Error inserting ${table}: ${error.message}`);
      debugger;
    }
  }
}

async function main() {
  //await copy('orgs');
  //await copy('users');
  //await copy('relation_orgs');
  //await copy('relation_members');
  //await copy('relation_parents');
  await copyMeetings();
  await copyPeople();
}

if (require.main === module) main();
