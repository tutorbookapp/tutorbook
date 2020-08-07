import axios, { AxiosPromise } from 'axios';
import { Match } from 'lib/model';

export interface BrambleRes {
  APImethod: string;
  status: string;
  result: string;
}

export function getBrambleDescription(url: string): string {
  const description =
    `Join your tutoring lesson via <a href="${url}">this Bramble room</a>. ` +
    'Your room will be reused weekly until your tutoring lesson is cancelled.' +
    'To learn more about Bramble, head over to <a href="https://about.bramble' +
    '.io/help/help-home.html">their help center</a>.';
  return description;
}

/**
 * Creates a new Bramble room using their REST API.
 * @see {@link https://about.bramble.io/api.html}
 */
export function createBrambleRoom(match: Match): AxiosPromise<BrambleRes> {
  return axios({
    method: 'post',
    url: 'https://api.bramble.io/createRoom',
    headers: {
      room: match.id,
      agency: 'tutorbook',
      auth_token: process.env.BRAMBLE_API_KEY as string,
    },
  }) as AxiosPromise<BrambleRes>;
}
