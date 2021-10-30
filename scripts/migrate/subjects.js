const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();

const dev = require('../supabase')('development');
const prod = require('../supabase')('production');
const logger = require('../lib/logger');

const CATEGORIES = [
  'math',
  'science',
  'history',
  'english',
  'language',
  'business',
  'music',
  'tests',
  'art',
  'cs'
];

// I'm not allowed to insert into the `meetings` ID column because it's set to
// always be generated as a `bigint`. So, I have to map all the original IDs to
// the created IDs to be used when I'm creating the `relation_people` table.
const meetingIds = {};

const subjectsPath = path.resolve(__dirname, './subjects.json');
const subjects = require(subjectsPath);

async function migrate(col = 'user', table = `${col}s`) {
  logger.info(`Selecting ${table} from production...`);
  const { data, error } = await prod.from(table).select();
  if (error) {
    logger.error(`Error selecting ${table}: ${error.message}`);
    debugger;
  } else if (!data) {
    logger.error(`Missing ${table} data: ${data}`);
    debugger;
  } else {
    logger.info(`Processing ${data.length} ${table}' subjects...`);
    const subjectsToCreate = [];
    data.forEach((row) => row.subjects?.forEach((name) => {
      if (![...subjects, ...subjectsToCreate].some((s) => s.name === name)) {
        let category;
        while (!CATEGORIES.includes(category) && category !== 'delete')
          category = prompt(`What category is "${name}"? (${CATEGORIES.join(', ')}) `);
        if (category !== 'delete') subjectsToCreate.push({ name, category });
      }
    }));

    logger.info(`Inserting ${subjectsToCreate.length} subjects into development...`);
    const { data: created, error } = await dev.from('subjects').insert(subjectsToCreate);
    if (error) {
      logger.error(`Error inserting subjects: ${error.message}`);
      debugger;
      throw new Error(`Error inserting subjects: ${error.message}`);
    }
    created.forEach((s) => subjects.push(s));
    fs.writeFileSync(subjectsPath, JSON.stringify(subjects, null, 2));

    const relationSubjects = [];
    const originalIds = data.map((row) => row.id);
    data.forEach((row) => {
      row.subjects?.forEach((name) => {
        const subject = subjects.find((s) => s.name === name);
        if (!subject) {
          logger.warn(`Subject (${name}) not found!`);
          debugger;
        }
        relationSubjects.push({ [col]: row.id, subject: subject.id });
      });
      delete row.subjects;
      if (col === 'meeting') delete row.id;
    });
    logger.info(`Inserting ${data.length} ${table} into development...`);
    const { error: err, data: inserted } = await dev.from(table).insert(data);
    if (err) {
      logger.error(`Error inserting ${table}: ${err.message}`);
      debugger;
      throw new Error(`Error inserting ${table}: ${err.message}`);
    }
    if (col === 'meeting') {
      originalIds.forEach((id, idx) => {
        meetingIds[id] = inserted[idx].id;
      });
      relationSubjects.forEach((row) => {
        row[col] = meetingIds[row[col]];
      });
    }
    logger.info(`Inserting ${relationSubjects.length} relation_${col}_subjects into development...`);
    const { error: e } = await dev.from(`relation_${col}_subjects`).insert(relationSubjects);
    if (e) {
      logger.error(`Error inserting relation_${col}_subjects: ${e.message}`);
      debugger;
      throw new Error(`Error inserting relation_${col}_subjects: ${e.message}`);
    }
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
  await migrate('user');
  await migrate('org');
  await copy('relation_orgs');
  await copy('relation_members');
  await copy('relation_parents');
  await migrate('meeting');
  await copyPeople();
}

if (require.main === module) main();
