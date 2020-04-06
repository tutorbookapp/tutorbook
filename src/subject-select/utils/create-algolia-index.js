const id = 'TODO: ADD-ALGOLIA-APP-ID-HERE';
const key = 'TODO: ADD-ALGOLIA-KEY-HERE';
const client = require('algoliasearch')(id, key);
const to = require('await-to-js').default;
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

const main = async () => {
  const subjects = parse(fs.readFileSync('./subjects.csv'), {
    columns: true,
    skip_empty_lines: true,
  });
  const [err, res] = await to(client.initIndex('subjects').saveObjects(subjects, {
    autoGenerateObjectIDIfNotExist: true,
  }));
  if (err) {
    console.error('[ERROR] While saving subjects:', err);
    debugger;
  }
};

main();
