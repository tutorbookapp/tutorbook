import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Snackbar } from '@rmwc/snackbar';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import { Meeting, MeetingJSON } from 'lib/model/meeting';
import useClickOutside, { ClickContext } from 'lib/hooks/click-outside';
import { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { useOrg } from 'lib/context/org';
import useSingle from 'lib/hooks/single';
import { useUser } from 'lib/context/user';

import { CreateDialog, DialogSurface, EditDialog } from './dialogs';
import { CalendarContext } from './context';
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

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string>();
  const [viewing, setViewing] = useState<Meeting>();

  const originalEditing = useRef<Meeting>(initialEditData);
  const updateMeetingRemote = useCallback(async (updated: Meeting) => {
    const url = `/api/meetings/${updated.id}`;
    const { data: updatedMeeting } = await axios.put<MeetingJSON>(url, {
      ...updated.toJSON(),
      options: { original: originalEditing.current.toJSON() },
    });
    return Meeting.fromJSON(updatedMeeting);
  }, []);

  const { updateEl, removeEl } = useClickOutside(
    () => setDialogOpen(false),
    dialogOpen
  );
  const {
    data: editing,
    setData: setEditing,
    onSubmit: onEditStop,
    loading: editLoading,
    checked: editChecked,
    error: editError,
  } = useSingle<Meeting>(initialEditData, updateMeetingRemote, mutateMeeting);

  useEffect(() => {
    if (editing.id !== originalEditing.current.id)
      originalEditing.current = editing;
  }, [editing]);

  useEffect(() => {
    setViewing((prev) => {
      if (prev?.id.startsWith('temp')) return prev;
      const idx = meetings.findIndex((m) => m.id === prev?.id);
      if (idx < 0) {
        setDialogOpen(false);
        return prev;
      }
      if (dequal(meetings[idx], prev)) return prev;
      return meetings[idx];
    });
  }, [meetings]);

  // Don't unmount the dialog surface if the user is draggingId (in that case, we
  // only temporarily hide the dialog until the user is finished draggingId).
  const onClosed = useCallback(() => {
    if (!draggingId) setViewing(undefined);
  }, [draggingId]);

  const [rowsMeasureRef, rowsMeasure] = useMeasure({ polyfill });
  const [cellsMeasureIsCorrect, setCellsMeasureIsCorrect] = useState(false);
  const [cellsMeasureRef, cellsMeasure] = useMeasure({
    polyfill,
    scroll: true,
  });
  const [cellMeasureRef, { width: cellWidth }] = useMeasure({ polyfill });

  // See: https://github.com/pmndrs/react-use-measure/issues/37
  // Current workaround is to listen for scrolls on the parent div. Once
  // the user scrolls, we know that the `rowsMeasure.x` is no longer correct
  // but that the `cellsMeasure.x` is correct.
  const offset = useMemo(
    () => ({
      x: cellsMeasureIsCorrect ? cellsMeasure.x : rowsMeasure.x + 8,
      y: cellsMeasure.y,
    }),
    [cellsMeasureIsCorrect, cellsMeasure.x, cellsMeasure.y, rowsMeasure.x]
  );

  useEffect(() => {
    setCellsMeasureIsCorrect(false);
  }, [filtersOpen]);

  return (
    <CalendarContext.Provider
      value={{ mutateMeeting, removeMeeting, startingDate: query.from }}
    >
      <ClickContext.Provider value={{ updateEl, removeEl }}>
        {editChecked && <Snackbar message='Updated meeting.' leading open />}
        {editError && (
          <Snackbar
            message='Could not update meeting. Try again later.'
            leading
            open
          />
        )}
        {editLoading && !editChecked && !editError && (
          <Snackbar message='Updating meeting...' timeout={-1} leading open />
        )}
        {viewing && (
          <DialogSurface
            width={cellWidth}
            offset={offset}
            viewing={viewing}
            dialogOpen={dialogOpen && !draggingId}
            setDialogOpen={setDialogOpen}
            onClosed={onClosed}
          >
            {!viewing.id.startsWith('temp') && (
              <EditDialog meeting={viewing} dialogOpen={dialogOpen} />
            )}
            {viewing.id.startsWith('temp') && (
              <CreateDialog viewing={viewing} setViewing={setViewing} />
            )}
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
              editing={editing}
              setEditing={setEditing}
              onEditStop={onEditStop}
              viewing={viewing}
              setViewing={setViewing}
              draggingId={draggingId}
              setDraggingId={setDraggingId}
              rowsMeasureRef={rowsMeasureRef}
              cellsMeasureRef={cellsMeasureRef}
              cellMeasureRef={cellMeasureRef}
              cellWidth={cellWidth}
              offset={offset}
              setCellsMeasureIsCorrect={setCellsMeasureIsCorrect}
            />
            <FiltersSheet
              query={query}
              setQuery={setQuery}
              filtersOpen={filtersOpen}
            />
          </div>
        </div>
      </ClickContext.Provider>
    </CalendarContext.Provider>
  );
}
