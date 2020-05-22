const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const client = require('algoliasearch')(
  process.env.ALGOLIA_SEARCH_ID,
  process.env.ALGOLIA_SEARCH_KEY
);
const to = require('await-to-js').default;
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

const main = async (id = 'subjects') => {
  const index = client.initIndex(id);
  index.setSettings({
    attributesForFaceting: ['filterOnly(grades)', 'filterOnly(name)'],
  });
  const subjects = parse(fs.readFileSync(`./${id}.csv`), {
    columns: true,
    skip_empty_lines: true,
  })
    .map((subject) => {
      subject.grades = (subject.grades || '').split(', ');
      return subject;
    })
    .filter((subject) => !!subject.name);
  const [err, res] = await to(
    index.saveObjects(subjects, {
      autoGenerateObjectIDIfNotExist: true,
    })
  );
  if (err) {
    console.error(`[ERROR] While saving ${id}:`, err);
    debugger;
  }
};

main('expertise');
