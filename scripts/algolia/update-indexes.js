const path = require('path');
const dotenv = require('dotenv');
const logger = require('../lib/logger');

const env = process.env.NODE_ENV || 'production';
logger.info(`Loading ${env} environment variables...`);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}.local`) });

const client = require('algoliasearch')(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
);
const to = require('await-to-js').default;
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

const subjects = async () => {
  logger.info('Clearing objects from subjects index...');
  const index = client.initIndex('subjects');
  const [err] = await to(index.clearObjects());
  if (err) {
    logger.error(`${err.name} clearing subjects index: ${err.message}`);
    debugger;
  }
  index.setSettings({
    attributesForFaceting: ['filterOnly(grades)', 'filterOnly(name)'],
  });
  logger.info('Parsing objects from ./subjects.csv...');
  const subjects = parse(fs.readFileSync('./subjects.csv'), {
    columns: true,
    skip_empty_lines: true,
  })
    .map((subject) => {
      const { grades, synonyms, categories } = subject;
      subject.grades = grades ? grades.split(', ') : [];
      subject.synonyms = synonyms ? synonyms.split(', ') : [];
      subject.categories = categories ? categories.split(', ') : [];
      return subject;
    })
    .filter((subject) => !!subject.name);
  logger.info(`Saving ${subjects.length} objects to subjects index...`);
  const [e, res] = await to(
    index.saveObjects(subjects, { autoGenerateObjectIDIfNotExist: true })
  );
  if (e) {
    logger.error(`${e.name} updating subjects index: ${e.message}`);
    debugger;
  }
};

const generic = async (id) => {
  const index = client.initIndex(id);
  logger.info(`Clearing index (${id})...`);
  const [clearErr] = await to(index.clearObjects());
  if (clearErr) {
    logger.error(
      `${clearErr.name} clearing index (${id}): ${clearErr.message}`
    );
    debugger;
  }
  const objs = parse(fs.readFileSync(`./${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  })
    .filter((obj) => !!obj.objectID)
    .map((obj) => {
      for (const [key, val] of Object.entries(obj)) {
        if (key === 'objectID') continue;
        const name = val.split(', ')[0];
        const synonyms = val.split(', ').filter((n) => n !== name);
        obj[key] = { name, synonyms };
      }
      return obj;
    });
  logger.info(`Saving ${objs.length} objects...`);
  const [updateErr] = await to(index.saveObjects(objs));
  if (updateErr) {
    logger.error(
      `${updateErr.name} updating index (${id}): ${updateErr.message}`
    );
    debugger;
  }
};

if (require.main === module) subjects();
