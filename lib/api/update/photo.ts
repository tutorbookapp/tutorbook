import { Stream } from 'stream';

import axios, { AxiosResponse } from 'axios';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
import to from 'await-to-js';
import { v4 as uuid } from 'uuid';

import { APIError } from 'lib/api/error';
import { Account } from 'lib/model';
import { bucket } from 'lib/api/firebase';
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
function crop(src: Buffer, width = 500, height = 500): Promise<Stream> {
  return smartcrop.crop(src, { width, height }).then(({ topCrop }) => {
    return sharp(src)
      .extract({
        width: topCrop.width,
        height: topCrop.height,
        left: topCrop.x,
        top: topCrop.y,
      })
      .resize(width, height)
      .jpeg();
  });
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
export default async function updatePhoto(account: Account): Promise<void> {
  // Skip 'assets.tutorbook.app' photos that are used during integration tests.
  if (/https:\/\/assets\.tutorbook\.app\/(.*)/.exec(account.photo)) return;
  if (/test-tutorbook\.appspot\.com/.exec(account.photo)) return;
  if (!account.photo) return;

  // Download the image, crop and/or resize it to 500x500 pixels, and upload the
  // final result to the proper location in our GCP Storage bucket.
  const photo = await crop(await downloadPhoto(account.photo));
  const filename = getPhotoFilename(account.photo) || `temp/${uuid()}.jpg`;
  const file = bucket.file(filename);
  const token = uuid();
  const metadata = { metadata: { firebaseStorageDownloadTokens: token } };
  await new Promise((resolve, reject) => {
    photo
      .pipe(file.createWriteStream({ metadata }))
      .on('error', reject)
      .on('finish', resolve);
  });
  account.photo =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(file.name)}?alt=media&token=${token}`;
}
