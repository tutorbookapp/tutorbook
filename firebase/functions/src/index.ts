import * as functions from 'firebase-functions';
import axios from 'axios';

export const updateMeetings = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(() => axios.get('https://tutorbook.org/api/update-meetings'));
