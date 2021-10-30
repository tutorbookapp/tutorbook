// Copies the subjects from one database to another, preserving IDs by inserting
// in order (so that our database automatically assigns the correct ID). This
// only works if the new `subjects` table hasn't been inserted to already.

const dev = require('../../supabase')('test');
const test = require('../../supabase')('development');
const logger = require('../../lib/logger');

async function copy(table = 'subjects') {
  logger.info(`Selecting ${table} from development...`);
  const { data: rows, error } = await dev.from(table).select().order('id');
  if (error) {
    logger.error(`Error selecting ${table}: ${error.message}`);
    debugger;
  } else if (!rows) {
    logger.error(`Missing data: ${rows}`);
    debugger;
  } else {
    logger.info(`Inserting ${rows.length} ${table} into test...`);
    for await (const row of rows) {
      const idx = rows.indexOf(row) + 1;
      if (row.id !== idx) {
        logger.error(`Row ID (${row.id}) did not match IDX (${idx})`);
        debugger;
      }
      delete row.id;
      logger.verbose(`Inserting ${row.name} (${idx})...`);
      const { error, data } = await test.from(table).insert(row);
      if (error) {
        logger.error(`Error inserting ${table}: ${error.message}`);
        debugger;
      } else if (data[0].id !== idx) {
        logger.error(`Created ID (${data[0].id}) did not match IDX (${idx})`);
        debugger;
      }
    }
  }
}

if (require.main === module) copy();
