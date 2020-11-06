import { Stream } from 'stream';

import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';
import { v4 as uuid } from 'uuid';

import { APIError } from 'lib/api/error';
import { Account } from 'lib/model';
import { bucket } from 'lib/api/firebase';
import { validPhoto } from 'lib/utils';

/**
 * Ensures that the account's photo is stored in our GCP Storage bucket, is
 * cropped to a square (1:1) aspect ratio, and is stored in the correct location
 * (i.e. nested under the user's folder).
 * @param account - The account whose photo we need to update.
 * @return Nothing; this performs side effects on the original account object.
 */
export default async function updatePhoto(account: Account): Promise<void> {
  if (validPhoto(account.photo)) {
    // Ensure that filename is in the proper location. Ensure that the photo is
    // cropped to a square (1:1) ratio.
  } else if (account.photo) {
    // Download the image, crop it to a square (1:1) ratio, and upload the final
    // result to the proper location in our GCP Storage bucket.
    const [err, res] = await to(
      axios.get<Stream>(account.photo, { responseType: 'stream' })
    );
    if (err) {
      const msg = `${err.name} downloading photo (${account.photo})`;
      throw new APIError(`${msg}: ${err.message}`, 500);
    }
    const file = bucket.file(`temp/${uuid()}`);
    const token = uuid();
    await new Promise((resolve, reject) => {
      (res as AxiosResponse<Stream>).data
        .pipe(
          file.createWriteStream({
            metadata: { metadata: { firebaseStorageDownloadTokens: token } },
          })
        )
        .on('error', reject)
        .on('finish', resolve);
    });
    account.photo =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(file.name)}?alt=media&token=${token}`;
  }
}
