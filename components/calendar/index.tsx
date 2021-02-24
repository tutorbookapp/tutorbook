import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { dequal } from 'dequal/lite';

import { Meeting, MeetingsQuery } from 'lib/model';
import { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import { CalendarContext } from './context';
import FiltersSheet from './filters-sheet';
import Header from './header';
import SearchBar from './search-bar';
import WeeklyDisplay from './weekly-display';
import styles from './calendar.module.scss';

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
      await mutate(query.endpoint, { meetings: json }, false);
    },
    [query.endpoint, meetings]
  );
  const removeMeeting = useCallback(
    async (meetingId: string) => {
      const idx = meetings.findIndex((m) => m.id === meetingId);
      if (idx < 0) return;
      const updated = [...meetings.slice(0, idx), ...meetings.slice(idx + 1)];
      const json = updated.map((m) => m.toJSON());
      await mutate(query.endpoint, { meetings: json }, false);
    },
    [query.endpoint, meetings]
  );

  return (
    <CalendarContext.Provider
      value={{ mutateMeeting, removeMeeting, startingDate: query.from }}
    >
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
          />
          <FiltersSheet
            query={query}
            setQuery={setQuery}
            filtersOpen={filtersOpen}
          />
        </div>
      </div>
    </CalendarContext.Provider>
  );
}
