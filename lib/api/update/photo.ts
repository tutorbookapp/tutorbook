import { Stream } from 'stream';

import axios, { AxiosResponse } from 'axios';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
import to from 'await-to-js';
import { v4 as uuid } from 'uuid';

import { APIError } from 'lib/api/error';
import { Account } from 'lib/model/account';
import { bucket } from 'lib/api/firebase';
import clone from 'lib/utils/clone';
import { getPhotoFilename } from 'lib/utils';

/**
 * Uses Smartcrop.js and Sharp to crop and/or resize the given image buffer to
 * 500x500 pixels (by default; that width and height are configurable).
 * @see {@link https://github.com/jwagner/smartcrop-cli/blob/master/smartcrop-cli.js}
 * @see {@link https://github.com/jwagner/smartcrop.js#node}
 * @see {@link https://github.com/jwagner/smartcrop-sharp}
 * @see {@link https://github.com/lovell/sharp}
 * @todo Debug the system wide OpenCV requirements and ensure that Vercel has
 * them installed before implementing face detection in production.
 * @todo Ideally, we'd work completely with streams but the docs for
 * Smartcrop.js indicate it needs a buffer.
 * @param src - The image source as a buffer (e.g. downloaded using Axios).
 * @param [width] - The desired width in pixels; defaults to 500.
 * @param [height] - The desired height in pixels; defaults to 500.
 */
async function crop(src: Buffer, width = 500, height = 500): Promise<Stream> {
  const { topCrop } = await smartcrop.crop(src, { width, height });
  return sharp(src)
    .extract({
      width: topCrop.width,
      height: topCrop.height,
      left: topCrop.x,
      top: topCrop.y,
    })
    .resize(width, height)
    .jpeg();
}

async function downloadPhoto(src: string): Promise<Buffer> {
  const [err, res] = await to(
    axios.get<Buffer>(src, { responseType: 'arraybuffer' })
  );
  if (err) {
    const msg = `${err.name} downloading photo (${src})`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return (res as AxiosResponse<Buffer>).data;
}

/**
 * Ensures that the account's photo is stored in our GCP Storage bucket, is
 * cropped to a square (1:1) aspect ratio, and is stored in the correct location
 * (i.e. nested under the user's folder).
 * @param account - The account whose photo we need to update.
 * @return Nothing; this performs side effects on the original account object.
 */
export default async function updatePhoto<T extends Account>(account: T): Promise<T> {
  // Skip 'assets.tutorbook.org' photos that are used during integration tests.
  if (/test-tutorbook\.appspot\.com/.exec(account.photo)) return account;
  if (/assets\.tutorbook\.org/.exec(account.photo)) return account;
  if (!account.photo) return account;

  // Download the image, crop and/or resize it to 500x500 pixels, and upload the
  // final result to a completely new location in our GCP Storage bucket.
  const cropped = await crop(await downloadPhoto(account.photo));

  // Remove the old photo's filename and create a new one. Otherwise, Next.js
  // will continue to use the cached (uncropped) version of the profile photo.
  const existing = getPhotoFilename(account.photo);
  // TODO: Remove the old photo and debug any front-end issues where it isn't
  // account properly and we get a 404 when fetching it for a second time.
  if (false && existing) await bucket.file(existing).delete().catch();

  const file = bucket.file(`temp/${uuid()}.jpg`);
  const token = uuid();
  const metadata = { metadata: { firebaseStorageDownloadTokens: token } };
  await new Promise((resolve, reject) => {
    cropped
      .pipe(file.createWriteStream({ metadata }))
      .on('error', reject)
      .on('finish', resolve);
  });
  const photo =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(file.name)}?alt=media&token=${token}`;

  return clone({ ...account, photo });
}
