import { createContext, useContext } from 'react';

import { Meeting, MeetingsQuery } from 'lib/model';

export interface CalendarContextValue {
  startingDate: Date;
  mutateMeeting: (mutated: Meeting, hasBeenUpdated?: boolean) => Promise<void>;
}

export const CalendarContext = createContext<CalendarContextValue>({
  startingDate: new MeetingsQuery().from,
  mutateMeeting: async (mutated: Meeting, hasBeenUpdated?: boolean) => {},
});

export const useCalendar = () =>
  useContext<CalendarContextValue>(CalendarContext);
