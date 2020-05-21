const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env.prod') });

const client = require('algoliasearch')(
  process.env.ALGOLIA_SEARCH_ID,
  process.env.ALGOLIA_SEARCH_KEY
);
const to = require('await-to-js').default;
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

const main = async () => {
  const index = client.initIndex('subjects');
  index.setSettings({
    attributesForFaceting: ['filterOnly(grades)', 'filterOnly(name)'],
  });
  const subjects = parse(fs.readFileSync('./subjects.csv'), {
    columns: true,
    skip_empty_lines: true,
  })
    .map((subject) => {
      subject.grades = subject.grades.split(', ');
      return subject;
    })
    .filter((subject) => !!subject.name);
  const [err, res] = await to(
    index.saveObjects(subjects, {
      autoGenerateObjectIDIfNotExist: true,
    })
  );
  if (err) {
    console.error('[ERROR] While saving subjects:', err);
    debugger;
  }
};

main();
