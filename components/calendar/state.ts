import { FormEvent, createContext, useContext } from 'react';

import { Callback } from 'lib/model/callback';
import { Meeting } from 'lib/model/meeting';
import { MeetingsQuery } from 'lib/model/query/meetings';

export enum DialogPage {
  Display = 0,
  Edit,
  Create,
}

export interface CalendarState {
  start: Date;
  editing: Meeting;
  setEditing: Callback<Meeting>;
  onEditStop: (evt?: FormEvent) => void;
  rnd: boolean;
  setRnd: Callback<boolean>;
  dialog: boolean;
  setDialog: Callback<boolean>;
  setDialogPage: Callback<DialogPage>;
  dragging: boolean;
  setDragging: Callback<boolean>;
}

export const CalendarStateContext = createContext<CalendarState>({
  start: MeetingsQuery.parse({}).from,
  editing: Meeting.parse({}),
  setEditing: () => {},
  onEditStop: () => {},
  rnd: false,
  setRnd: () => {},
  dialog: false,
  setDialog: () => {},
  setDialogPage: () => {},
  dragging: false,
  setDragging: () => {},
});

export const useCalendarState = (): CalendarState =>
  useContext<CalendarState>(CalendarStateContext);
