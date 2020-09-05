<!-- Is this a question? Questions WILL BE CLOSED. Ask in our chat https://on.cypress.io/chat  -->

### Current behavior:

I'm using a service worker to handle authentication by intercepting `fetch` requests and appending a JWT in their `Authentication` headers (as @nkbt [described here](https://github.com/cypress-io/cypress/issues/702#issuecomment-501084448)). Without that service worker, the app doesn't know if it's logged in or not.

Currently during development, I always open up developer tools and check the "Allow service workers over HTTP" box like so:
![image](https://user-images.githubusercontent.com/20798889/92285454-32640e80-eeb9-11ea-8737-54ab19cfd852.png)

With Cypress, I can do the same thing when running `cypress open` and actually viewing the browser, but I don't know how to change the browser settings for Electron or headless Chrome when Cypress runs on my CI server.

_Originally posted by @nicholaschiang in https://github.com/cypress-io/cypress/issues/702#issuecomment-687390950_

### Desired behavior:

Cypress should enable service workers over HTTP in all of it's browsers (whether headless or headed) by default. Or, at least, Cypress should provide some documentation and API for manipulating browser options like this.

### Test code to reproduce

1. Clone [this repository](https://github.com/tutorbookapp/tutorbook):

```
$ git clone https://github.com/tutorbookapp/tutorbook
```

2. Check out to the `eacacf7` commit hash (on the `cypress` branch):

```
$ git checkout eacacf7
```

3. Install dependencies (including Cypress):

```
$ yarn install
```

4. Create the following `.env` file (in the repository root) with the following (I created a test project for this... these keys can be public):

```dotenv
NODE_ENV="development"
FIRESTORE_EMULATOR_HOST="localhost:8080"
FIREBASE_PROJECT_ID="cypress-sw-over-http"
FIREBASE_APP_ID="1:435534167292:web:8230dfa674a63559ef6b79"
FIREBASE_API_KEY="AIzaSyAwyhC6IhAK5JgX3MQvPLzh7Pp9v4opNZw"
FIREBASE_AUTH_DOMAIN="cypress-sw-over-http.firebaseapp.com"
FIREBASE_DATABASE_URL="https://cypress-sw-over-http.firebaseio.com"
FIREBASE_STORAGE_BUCKET="cypress-sw-over-http.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="435534167292"
FIREBASE_MEASUREMENT_ID="G-FQNBG84BH3"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-jkfo7@cypress-sw-over-http.iam.gserviceaccount.com"
FIREBASE_ADMIN_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJEKTX4eKvw4Vz\nWaYQvzCnSqBy3a+XTqPm1QKy3XIAVoYCB9h+g6HGNzLhfOTnUHd03Af6aOFdYNQ6\nOFBJ1T5kbaWD9kFE+rQJe3lJLj52KF0KD2WpIRlmTsNQhMRnVdlZKBVRQygDysbi\nohtOSpnx92IslaiyY96kB4XE1C4JLUmIJNBMgPs9pd0PVvrfVuCi/E3Qb8sfYrbl\nqjCZ+dKzy6lMP/5hLQA+dSPHFzLM8T4hf6zJ3HD02cQfOy84QBFKsSvGpNgO4+KH\nHai32kFiO8BFGmvbW/n6wZOH9oSnz1SrIuZ/1UC5yYRhCJWmPIYBcCdBjT46ELRW\nmK+CZe3hAgMBAAECggEAA/nHJqkl5jeRo5Wj19wt8jriqA7L3mwsx79Rw7dm/gx3\n7yGYVW0VJXIZOJXzgULpL8d7hWcuQJ5N5/5N0R3tM0drQMwdX4etCGx3ehvW2peC\n+nRSPGlGAyy+xjBv4UK0buPA4yfWqleHvfq6Wz6Uo3ESsQK/EJLyt6/Z5GnVJLOG\nchxg1x05jo+uQBnchYti9QF+HFVrYG1nUiBA7t2GeLx1WnlwSlirbEeGvbwAOYAk\nn1Ph1TorqTbviR7244lZz7WeFRwfN44qEDPoWTOHifOigFdYUK2FX93Uoi397iIL\n38SslS31NYJhFDV6sB7EIJLxkAbgx3MkjdL3WB7taQKBgQDkiyb2V5NUx3n+so80\nQtLJwWgVQ0uGXKj7cds399K68Apg6mkvl639bfuUIFKqTGjiwGaviJmaEpMUSPKX\nljmsWndS9xeM0Jo6abOCrVo32OPE5ZcPCO5AXLx77gLDhvL1z23TeX5VPQ9qD0OI\na6UeRiFCgIkE+okq33urfqu3yQKBgQDhOGPe8kXyKl0xy9r87nfKpe3JahhmE/yU\nHAHtbHO5muzmHUftRuYagXcDfNbdM4n8tZLx0yapRcXVuxIwqOqk1XjVFiK5qdPk\nvVZI4xafIoi2QpPmtRNPmsTpxIx8+UG2VduTm/m/alZfPzaW09M9F6xoDnFu18gi\nkrE4DUFBWQKBgGqfXNMKsmqYEZs41MSN9Gc5+wQIfEC4FAIS8TIgRUj/WegzFFWm\nzv5wBDHsDoTy1vAK0R1NflO6HLIXAk6kQE3fetHTA0Knw3xC+gOaOn/ZiRHABwR1\npymR2kF7HgD4gXsaheNmSAEeVoWlj10i00rXbwbmjoYrGDlPQBQXKae5AoGAfKnt\n/hY0yVrRwyKH0MFe5Xj7KiXj43zkrkbiej0xwWcUAjvq+FfqPnmzGucbN82zb4JC\nGEE8gS3x1+B4rR6S4zKWc7yQ9BwhAdgbzrSEbQl8iwZHP8izK7kLjioRaYu+5+KW\nbBpGH8IIlSg0W0BdCM/1ypNUDnq6eQiht9j+aeECgYAMGW9AFRo5zyup8XgHDZK6\nCUfrrsOgORtZvmo8f2TG3GQ5IbQtNv0RLkvjOZdCBQoJRcmKHUyhAfuM9iPEj7q4\n5TJc3w+rYXCGbhJR8b/q++FmoPjNXX40QD1gfAsLgisvsVplh7avgsWB4lF6D/c8\ncfdaWas0fy2iA5pNhkCgAA==\n-----END PRIVATE KEY-----\n"
```

5. Start the Firebase emulator, Next.js development server, and open Cypress by running:

```
$ yarn dev
```

6. Once Cypress is open, run the `integrations/user/login.spec.ts` integration test and you should come across this assertion error:
7. Then, open up developer tools, click on the three dots to open up the drop-down menu, hit settings, and check "Allow service workers over HTTP" (and then keep your developer tools open when running tests):
8. Reload, run the test again, and you should see that it passed (because my service worker intercepted the `/api/account` request and added an authentication JWT).

### Versions

Cypress: 5.1.0
OS: Ubuntu 18.02.x
Browser: Chrome 83
