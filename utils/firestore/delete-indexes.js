const {
    google,
} = require('googleapis');
const readline = require('readline-sync');
const axios = require('axios');
const sleep = require('sleep');
const fs = require('fs');

const TOKEN_FILE = './token.json';
const SCOPES = ['https://www.googleapis.com/auth/datastore'];
const CLIENT_ID = 'TODO: INSERT-GCP-PROJECT-OAUTH-2.0-CLIENT-ID';
const CLIENT_SECRET = 'TODO: INSERT-GCP-PROJECT-OAUTH-2.0-CLIENT-SECRET';
const REDIRECT_URL = 'http://localhost:5000'; // Stub; this could be anything
const COLLECTIONS = [
    'access', // First-level collections
    'auth',
    'chats',
    'locations',
    'stripeAccounts',
    'stripeCustomers',
    'users',
    'websites',
    'appointments', // Second-level subcollections
    'pastAppointments',
    'activeAppointments',
    'requestsIn',
    'modifiedRequestsIn',
    'canceledRequestsIn',
    'requestsOut',
    'modifiedRequestsOut',
    'rejectedRequestsOut',
    'approvedRequestsOut',
    'announcements',
    'messages', // Third-level subcollections
];

/**
 * Requests permission and returns the OAuth 2.0 tokens with the given scopes.
 * @param {string[]} [scopes=SCOPES] - The scopes to request permissions for.
 * @return {Object} The OAuth 2.0 tokens with the requested scopes.
 */
const getOAuthTokens = async (scopes = SCOPES) => {
    if (fs.existsSync(TOKEN_FILE))
        return JSON.parse(fs.readFileSync(TOKEN_FILE));
    const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    console.log('[INFO] Authorize this script by going to:', url);
    const code = readline.question('[INFO] What is the authorization code? ');
    const tokens = await client.getToken(code);
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens));
    client.setCredentials(tokens);
    return tokens;
};

/**
 * Requests permissions (if they haven't already been given) and returns the
 * OAuth 2.0 bearer authorization string to be sent along with any REST API HTTP
 * requests.
 * @param {string[]} [scopes=SCOPES] - The scopes to request permissions for.
 * @return {string} The OAuth 2.0 bearer authorization string.
 */
const getBearer = async (scopes = SCOPES) => {
    const tokens = await getOAuthTokens();
    const token = tokens.tokens;
    return token.token_type + ' ' + token.access_token;
};

/**
 * Lists all of our current Firestore indexes via Firestore's Google Cloud REST 
 * API.
 * @see {@link https://cloud.google.com/firestore/docs/reference/rest/v1beta1/projects.databases.indexes/list}
 * @return {Promise<string[]>} Promise that resolves with the list of all of our
 * current indexes's IDs.
 */
const listIndexes = async () => {
    console.log('[INFO] Listing Firestore indexes...');
    return axios({
        method: 'get',
        url: 'https://firestore.googleapis.com/v1beta1/projects/tutorbook-' +
            '779d8/databases/(default)/indexes',
        headers: {
            'Authorization': (await getBearer()),
        },
    }).then(res => {
        return res.data.indexes.map(index => index.name);
    }).catch(err => {
        console.error('[ERROR] While listing indexes:', err.message);
        debugger;
    });
};

/**
 * Deletes the given list of index IDs using Firestore's Google Cloud REST API.
 * @see {@link https://cloud.google.com/firestore/docs/reference/rest/v1beta1/projects.databases.indexes/delete}
 * @param {string[]} indexes - The list of Firestore index IDs to delete.
 * @return {Promise<undefined>} Promise that resolves once all indexes have been
 * deleted.
 */
const deleteIndexes = async (indexes) => {
    console.log('[INFO] Deleting ' + indexes.length + ' Firestore indexes...');
    for (index of indexes) {
        sleep.sleep(1); // Wait btwn requests to avoid '409 Conflict' errors.
        await axios({
            method: 'delete',
            url: 'https://firestore.googleapis.com/v1beta1/' + index,
            headers: {
                'Authorization': (await getBearer()),
            },
        }).catch(err => {
            console.log('[ERROR] While deleting index (' +
                index.split('/').slice(-1)[0] + '):', err.message);
            debugger;
        });
    }
};

/**
 * Lists all of the field index exceptions using Firestore's Google Cloud REST 
 * API.
 * @see {@link https://cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.collectionGroups.fields/list?hl=en}
 * @return {Promise<string[]>} Promise that resolves with a list of all of the
 * field exception IDs currently in our Firestore project.
 * @deprecated
 * @todo Implement and test this.
 */
const listFields = async () => {
    console.log('[INFO] Listing Firestore field index exceptions...');
    return (await Promise.all(COLLECTIONS.map(async collection => axios({
        method: 'get',
        url: 'https://firestore.googleapis.com/v1/projects/tutorbook-779d8/' +
            'databases/(default)/collectionGroups/' + collection,
        headers: {
            'Authorization': (await getBearer()),
        },
    }).then(res => {
        return res.data.fields.map(field => field.name);
    }).catch(err => {
        console.error('[ERROR] While listing field index exceptions:',
            err.message);
        //debugger;
    })))).reduce((acc, cur) => (acc || []).concat(cur || []));
};

/**
 * Deletes all of the field index exceptions given.
 * @see {@link }
 * @param {string[]} fields - The list of Firestore field index exception IDs to
 * delete.
 * @return {Promise<undefined>} Promise that resolves once all of the given 
 * field index exceptions have been deleted.
 * @deprecated
 * @todo Implement and test this.
 */
const deleteFields = async (fields) => {
    console.log('[INFO] Deleting ' + fields.length + ' Firestore field index ' +
        'exceptions...');
    for (field of fields) {
        sleep.sleep(1); // Wait btwn requests to avoid '409 Conflict' errors.
        await axios({
            method: 'delete',
            url: 'https://firestore.googleapis.com/v1beta1/' + index,
            headers: {
                'Authorization': (await getBearer()),
            },
        }).catch(err => {
            console.log('[ERROR] While deleting index (' +
                index.split('/').slice(-1)[0] + '):', err.message);
            debugger;
        });
    }
};

/**
 * Lists and subsequently deletes all Firestore indexes.
 */
const main = async () => deleteIndexes((await listIndexes()));

main();