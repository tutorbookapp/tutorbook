import { NextApiResponse } from 'next';
import stringify from 'csv-stringify';

/**
 * Converts the given data into CSV form (using the objects' keys as column
 * headers) and pipes it to the response. Use this function to send users an
 * exportable CSV version of JSON app data.
 * @param res - The Node.js HTTP.ServerResponse object to pipe the CSV data to.
 * @param filename - The CSV filename w/out the extension (e.g. `users`).
 * @param data - An array of objects to convert to CSV form and export.
 */
export default function csv(
  res: NextApiResponse,
  filename: string,
  data: Record<string, string>[]
): void {
  const stringifier = stringify();

  if (data[0]) stringifier.write(Object.keys(data[0]));
  data.forEach((row) => stringifier.write(Object.values(row)));

  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment;filename=${filename}.csv`,
  });
  stringifier.pipe(res);
  stringifier.end();
}
