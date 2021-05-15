import * as functions from 'firebase-functions';
import axios from 'axios';

// CRON job that runs every hour, every day starting at 00:00.
// @see {@link https://bit.ly/3w66RLK}
// We use the event timestamp to correctly pick our time windows.
// @see {@link https://bit.ly/3fp8mOk}
export const sendReminders = functions.pubsub
  .schedule('every 1 hours synchronized')
  .onRun(({ timestamp }) => {
    const { token } = functions.config().remind as { token: string };
    const headers = { Authorization: `Bearer ${token}` };
    const time = encodeURIComponent(timestamp);
    const url = `https://tutorbook.org/api/remind?time=${time}`;
    return axios.get(url, { headers });
  });
