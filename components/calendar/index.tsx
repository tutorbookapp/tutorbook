import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Snackbar } from '@rmwc/snackbar';
import axios from 'axios';
import { dequal } from 'dequal/lite';

import DialogContent from 'components/dialog';

import { Meeting, MeetingJSON } from 'lib/model/meeting';
import useClickOutside, { ClickContext } from 'lib/hooks/click-outside';
import { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Position } from 'lib/model/position';
import { useOrg } from 'lib/context/org';
import usePeople from 'lib/hooks/people';
import useSingle from 'lib/hooks/single';
import { useUser } from 'lib/context/user';

import { CalendarStateContext } from './state';
import CreatePage from './dialog/create-page';
import DialogSurface from './dialog/surface';
import DisplayPage from './dialog/display-page';
import EditPage from './dialog/edit-page';
import FiltersSheet from './filters-sheet';
import Header from './header';
import SearchBar from './search-bar';
import WeeklyDisplay from './weekly-display';
import styles from './calendar.module.scss';

const initialEditData = new Meeting();

export interface CalendarProps {
  org?: boolean;
  user?: boolean;
}

export default function Calendar({
  org: byOrg,
  user: byUser,
}: CalendarProps): JSX.Element {
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [mutatedIds, setMutatedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState<MeetingsQuery>(
    new MeetingsQuery({ hitsPerPage: 1000 })
  );

  const { org } = useOrg();
  const { user } = useUser();
  const { data } = useSWR<ListMeetingsRes>(
    (byOrg && query.org) || (byUser && query.people.length)
      ? query.endpoint
      : null,
    {
      revalidateOnFocus: !mutatedIds.size,
      revalidateOnReconnect: !mutatedIds.size,
    }
  );
  const meetings = useMemo(
    () => data?.meetings.map((m) => Meeting.fromJSON(m)) || [],
    [data?.meetings]
  );

  useEffect(() => {
    setQuery((prev) => {
      if (!byOrg || !org || org.id === prev.org) return prev;
      return new MeetingsQuery({ ...prev, org: org.id });
    });
  }, [byOrg, org]);
  useEffect(() => {
    setQuery((prev) => {
      if (!byUser || !user) return prev;
      const people = [{ label: user.name, value: user.id }];
      if (dequal(prev.people, people)) return prev;
      return new MeetingsQuery({ ...prev, people });
    });
  }, [byUser, user]);

  const mutateMeeting = useCallback(
    async (mutated: Meeting, hasBeenUpdated = false) => {
      setMutatedIds((prev) => {
        const mutatedMeetingIds = new Set(prev);
        if (!hasBeenUpdated) mutatedMeetingIds.add(mutated.id);
        if (hasBeenUpdated) mutatedMeetingIds.delete(mutated.id);
        if (dequal([...mutatedMeetingIds], [...prev])) return prev;
        return mutatedMeetingIds;
      });
      // TODO: Remove meeting if it is no longer within the `query` dates (but
      // note we still want to show the loading indicator in the `Preview`).
      const idx = meetings.findIndex((m) => m.id === mutated.id);
      const updated =
        idx < 0
          ? [...meetings, mutated]
          : [...meetings.slice(0, idx), mutated, ...meetings.slice(idx + 1)];
      if (dequal(updated, meetings)) return;
      // Note: If we ever need to use the `hits` property, we'll have to update
      // this callback function to properly cache and reuse the previous value.
      const json = updated.map((m) => m.toJSON());
      await mutate(query.endpoint, { meetings: json }, hasBeenUpdated);
    },
    [query.endpoint, meetings]
  );
  const removeMeeting = useCallback(
    async (meetingId: string, hasBeenDeleted = false) => {
      const idx = meetings.findIndex((m) => m.id === meetingId);
      if (idx < 0) return;
      const updated = [...meetings.slice(0, idx), ...meetings.slice(idx + 1)];
      const json = updated.map((m) => m.toJSON());
      await mutate(query.endpoint, { meetings: json }, hasBeenDeleted);
    },
    [query.endpoint, meetings]
  );

  const [rnd, setRnd] = useState<boolean>(false);
  const [dialog, setDialog] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dialogPage, setDialogPage] = useState<number>(0);

  const original = useRef<Meeting>(initialEditData);
  const updateMeetingRemote = useCallback(async (updated: Meeting) => {
    if (updated.id.startsWith('temp')) {
      const url = '/api/meetings';
      const { data: createdMeeting } = await axios.post<MeetingJSON>(
        url,
        updated.toJSON()
      );
      return Meeting.fromJSON(createdMeeting);
    }
    const url = `/api/meetings/${updated.id}`;
    const { data: updatedMeeting } = await axios.put<MeetingJSON>(url, {
      ...updated.toJSON(),
      options: { original: original.current.toJSON() },
    });
    return Meeting.fromJSON(updatedMeeting);
  }, []);

  const {
    data: editing,
    setData: setEditing,
    onSubmit: onEditStop,
    loading: editLoading,
    checked: editChecked,
    error: editError,
  } = useSingle<Meeting>(initialEditData, updateMeetingRemote, mutateMeeting);

  const people = usePeople(editing.match);

  useEffect(() => {
    if (editing.id !== original.current.id) original.current = editing;
  }, [editing]);

  useEffect(() => {
    setEditing((prev) => {
      if (prev?.id.startsWith('temp')) return prev;
      const idx = meetings.findIndex((m) => m.id === prev?.id);
      if (idx < 0) {
        setDialog(false);
        return prev;
      }
      if (dequal(meetings[idx], prev)) return prev;
      return meetings[idx];
    });
  }, [setEditing, meetings]);

  const [width, setWidth] = useState<number>(0);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const clickContextValue = useClickOutside(() => setDialog(false), dialog);

  return (
    <CalendarStateContext.Provider
      value={{
        editing,
        setEditing,
        onEditStop,
        rnd,
        setRnd,
        dialog,
        setDialog,
        dragging,
        setDragging,
        start: query.from,
      }}
    >
      <ClickContext.Provider value={clickContextValue}>
        {!dialog && editLoading && !editChecked && !editError && (
          <Snackbar message='Updating meeting...' timeout={-1} leading open />
        )}
        {!dialog && editChecked && (
          <Snackbar message='Updated meeting.' leading open />
        )}
        {!dialog && editError && (
          <Snackbar
            message='Could not update meeting. Try again later.'
            leading
            open
          />
        )}
        {dialog && (
          <DialogSurface width={width} offset={offset}>
            <DialogContent
              active={dialogPage}
              setActive={setDialogPage}
              loading={editLoading}
              checked={editChecked}
              link={`/${editing.match.org}/matches/${editing.match.id}`}
            >
              <DisplayPage people={people} openEdit={() => setDialogPage(1)} />
              <EditPage
                people={people}
                loading={editLoading}
                checked={editChecked}
                error={editError}
              />
              <CreatePage
                people={people}
                loading={editLoading}
                checked={editChecked}
                error={editError}
              />
            </DialogContent>
          </DialogSurface>
        )}
        <Header query={query} setQuery={setQuery} />
        <div className={styles.wrapper}>
          <SearchBar
            query={query}
            setQuery={setQuery}
            setFiltersOpen={setFiltersOpen}
            byOrg={byOrg}
          />
          <div className={styles.content}>
            <WeeklyDisplay
              searching={!data}
              meetings={meetings}
              filtersOpen={filtersOpen}
              setDialogPage={setDialogPage}
              width={width}
              setWidth={setWidth}
              offset={offset}
              setOffset={setOffset}
            />
            <FiltersSheet
              query={query}
              setQuery={setQuery}
              filtersOpen={filtersOpen}
            />
          </div>
        </div>
      </ClickContext.Provider>
    </CalendarStateContext.Provider>
  );
}
