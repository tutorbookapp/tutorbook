// Uses the `subjects` table (from our development database) to update the
// Cypress JSON fixtures that use the old string-based `subjects` field.

const fs = require('fs');
const path = require('path');
const supabase = require('../../supabase')('development');
const logger = require('../../lib/logger');

const fixtures = [
  'users/volunteer.json',
  'users/student.json',
  'users/admin.json',
  'orgs/default.json',
  'orgs/school.json',
  'meeting.json',
];

async function main() {
  logger.info('Fetching existing subjects...');
  const { data } = await supabase.from('subjects').select();
  logger.info(`Updating ${fixtures.length} fixtures' subjects...`);
  fixtures.forEach((fixturePath) => {
    const full = path.resolve(__dirname, `../../../cypress/fixtures/${fixturePath}`);
    logger.verbose(`Updating ${full} subjects...`);
    const fixture = require(full);
    if (!fixture.subjects) return;
    const subjects = fixture.subjects.map((name) => {
      const subject = data.find((s) => s.name === name);
      if (!subject) throw new Error(`Missing subject (${name}) for ${fixture}`);
      return { name, id: subject.id };
    });
    fs.writeFileSync(full, JSON.stringify({ ...fixture, subjects }, null, 2));
  });
}

if (require.main === module) main();
