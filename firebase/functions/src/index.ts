import * as functions from 'firebase-functions';
import axios from 'axios';

// eslint-disable-next-line import/prefer-default-export
export const sendReminders = functions.pubsub
  .schedule('every hour')
  .onRun(() => {
    const { token } = functions.config().remind as { token: string };
    const headers = { Authorization: `Bearer ${token}` };
    return axios.get('https://tutorbook.org/api/remind', { headers });
  });
