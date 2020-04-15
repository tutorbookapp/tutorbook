/**
 * @todo
 * Actually implement this script.
 *
 * @description
 * This script anonymizes the data backed up from the `default` database
 * partition for use in the `test` database partition (during development). As
 * specified in our [Privacy Policy]{@link https://tutorbook.app/legal#privacy},
 * we **always** anonymize data for development purposes.
 *
 * @usage
 * First, change `INPUT` and `OUTPUT` to the filenames of your `default`
 * database backup and the desired `test` database backup location respectively.
 * Then, just run (to generate your anonymized data for your `test` partition):
 *
 * ```
 * $ node anonymize.js
 * ```
 *
 * @license
 * Copyright (C) 2020 Tutorbook
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see {@link https://www.gnu.org/licenses/}.
 */

const INPUT = './default.json';
const OUTPUT = './test.json';

const fs = require('fs');

/**
 * Returns a given database with a `lim` maximum number of documents in  every
 * collection (and subcollection).
 * @param {Map} database - The JSON backup form of the Firestore database.
 * @param {int} [lim=10] - The maximum number of documents that are left under
 * each collection.
 * @return {Map} The limited JSON database backup.
 */
const limit = (database, lim = 10) => {
    const limited = {};
    Object.entries(database).forEach(([collection, documents]) => {
        limited[collection] = {};
        const docs = Object.entries(documents);
        for (var count = 0; count < docs.length && count < lim; count++) {
            docs[count][1]['__collections__'] =
                limit(docs[count][1]['__collections__'], lim);
            limited[collection][docs[count][0]] = docs[count][1];
        }
    });
    return limited;
};

/**
 * Reads in an `input` JSON database backup file, ensures that each collection
 * only contains a maximum of 10 documents (removes documents over the `limit`),
 * and writes the output back into the JSON backup file or into a specified
 * `output` file.
 * @param {string} input - The filename of the input JSON database backup file.
 * @param {string} [output=input] - The filename of the output JSON database
 * backup file (defaults to the input file).
 * @param {int} [lim=10] - The maximum number of documents that are left under
 * each collection.
 */
const limitJSON = (input, output = input, lim = 10) => {
    if (!fs.existsSync(input)) throw new Error('Input file must exist.');
    const original = JSON.parse(fs.readFileSync(input))['__collections__'];
    const limited = limit(original, lim);
    fs.writeFileSync(output, JSON.stringify({
        '__collections__': limited,
    }, null, 2));
};

limitJSON(INPUT, OUTPUT);
