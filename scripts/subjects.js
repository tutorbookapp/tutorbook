const fs = require('fs');
const path = require('path');
const parseSync = require('csv-parse/lib/sync');
const supabase = require('./supabase')('development');
const logger = require('./lib/logger');

const csvPath = path.resolve(__dirname, 'subjects.csv');
const csv = parseSync(fs.readFileSync(csvPath));

async function main(org = 'gunn') {
  logger.info('Fetching existing subjects...');
  const { data: existing } = await supabase.from('subjects').select();
  const subjects = [];
  const categories = csv.shift();
  csv.forEach((col) => {
    col.forEach((name, idx) => {
      if (name && existing.every((e) => e.name !== name))
        subjects.push({ name, category: categories[idx] });
    });
  });
  logger.info(`Inserting ${subjects.length} new subjects...`);
  const { data, error } = await supabase.from('subjects').insert(subjects);
  if (error) {
    logger.error(`Error inserting subjects: ${error.message}`);
    debugger;
  }
  const relations =
    csv.map((col) => col.filter((name) => !!name).map((name) => {
      const subject = [...existing, ...data].find((e) => e.name === name);
      return { org, subject: subject.id };
    })).flat();
  logger.info(`Inserting ${relations.length} new relation_org_subjects...`);
  const { error: err } = await supabase.from('relation_org_subjects').insert(relations);
  if (err) {
    logger.error(`Error inserting relation_org_subjects: ${err.message}`);
    debugger;
  }
}

if (require.main === module) main();
