const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'production';
console.log(`Loading ${env} environment variables...`);
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

const subjects = async (id) => {
  const index = client.initIndex(id);
  const [err] = await to(index.clearObjects());
  if (err) {
    console.error(`${err.name} clearing index (${id}):`, err);
    debugger;
  }
  index.setSettings({
    attributesForFaceting: ['filterOnly(grades)', 'filterOnly(name)'],
  });
  const subjects = parse(fs.readFileSync(`./${id}.csv`), {
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
  const [e, res] = await to(
    index.saveObjects(subjects, {
      autoGenerateObjectIDIfNotExist: true,
    })
  );
  if (e) {
    console.error(`${e.name} updating index (${id}):`, e);
    debugger;
  }
};

const generic = async (id) => {
  const index = client.initIndex(id);
  console.log(`Clearing index (${id})...`);
  const [clearErr] = await to(index.clearObjects());
  if (clearErr) {
    console.error(`${clearErr.name} clearing index (${id}):`, clearErr);
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
  console.log(`Saving ${objs.length} objects...`);
  const [updateErr] = await to(index.saveObjects(objs));
  if (updateErr) {
    console.error(`${updateErr.name} updating index (${id}):`, updateErr);
    debugger;
  }
};

if (require.main === module) subjects('mentoring');
