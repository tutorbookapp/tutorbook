import to from 'await-to-js';
import * as firebase from 'firebase/app';
import 'firebase/auth';

/**
 * Fixes the global scope to be that of a service worker instead of a web
 * worker.
 * @see {@link https://github.com/Microsoft/TypeScript/issues/11781#issuecomment-503773748}
 * @see {@link https://stackoverflow.com/a/56374158/10023158}
 */
declare const self: ServiceWorkerGlobalScope;

firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
});

/**
 * Returns a promise that resolves with an ID token if available.
 * @return {Promise<?string>} The promise that resolves with an ID token if
 * available. Otherwise, the promise resolves with null.
 */
async function getIdToken(): Promise<string | void> {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const [err, token] = await to<string>(user.getIdToken());
  if (err) return;
  return token;
}

/**
 * @see {@link https://stackoverflow.com/q/1420881/10023158}
 * @param {string} url The URL whose origin is to be returned.
 * @return {string} The origin corresponding to given URL.
 */
function getOriginFromUrl(url: string): string {
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  return `${protocol}//${host}`;
}

/**
 * Intercepts fetch requests and appends the Firebase Authentication JWT if it's
 * a same origin request (i.e. it's calling our own API).
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  function requestProcessor(token: string | void): Promise<Response> {
    let req = event.request;
    // For same origin https requests, append JWT to header.
    const sameOrigin: boolean =
      self.location.origin === getOriginFromUrl(event.request.url);
    const secure: boolean =
      self.location.protocol === 'https:' ||
      self.location.hostname === 'localhost' ||
      self.location.hostname === '0.0.0.0';
    if (sameOrigin && secure && token) {
      // Clone headers as request headers are immutable.
      const headers = new Headers();
      req.headers.forEach((val, key) => headers.append(key, val));
      // Add ID token to header. We can't add to Authentication header as it
      // will break HTTP basic authentication.
      headers.append('Authorization', `Bearer ${token}`);
      try {
        req = new Request(req.url, {
          headers,
          body: req.body,
          method: req.method,
          mode: 'same-origin',
          credentials: req.credentials,
          cache: req.cache,
          redirect: req.redirect,
          referrer: req.referrer,
        });
      } catch (e) {
        // This will fail for CORS requests. We just continue with the fetch
        // caching logic below and do not pass the ID token.
      }
    }
    return fetch(req);
  }
  // Try to fetch the resource first after checking for the JWT.
  event.respondWith(getIdToken().then(requestProcessor));
});
