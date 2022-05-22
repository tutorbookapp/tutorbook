import { memo, useCallback, useMemo } from 'react';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Header from 'components/header';

import { Callback } from 'lib/model/callback';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { useOrg } from 'lib/context/org';

import { useCalendarState } from './state';

export interface CalendarHeaderProps {
  query: MeetingsQuery;
  setQuery: Callback<MeetingsQuery>;
}

function CalendarHeader({ query, setQuery }: CalendarHeaderProps): JSX.Element {
  const { org } = useOrg();
  const { display } = useCalendarState();
  const { t, lang: locale } = useTranslation();

  const dayTitle = useMemo(() => query.from.toLocaleString(locale, { month: 'long', day: 'numeric', year: 'numeric' }), [query.from, locale]);
  const weekTitle = useMemo(() => {
    const { from, to } = query;
    if (from.getMonth() !== to.getMonth())
      return `${from.toLocaleString(locale, {
        month: 'short',
        year: from.getFullYear() !== to.getFullYear() ? 'numeric' : undefined,
      })} - ${to.toLocaleString(locale, {
        month: 'short',
        year: 'numeric',
      })}`;
    return from.toLocaleString(locale, { month: 'long', year: 'numeric' });
  }, [query, locale]);

  const delta = useMemo(() => display === 'Day' ? 1 : 7, [display]);
  const prev = useCallback(() => {
    setQuery((p) => {
      const from = new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate() - delta);
      const to = new Date(p.to.getFullYear(), p.to.getMonth(), p.to.getDate() - delta);
      return new MeetingsQuery({ ...p, from, to });
    });
  }, [setQuery, delta]);
  const next = useCallback(() => {
    setQuery((p) => {
      const from = new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate() + delta);
      const to = new Date(p.to.getFullYear(), p.to.getMonth(), p.to.getDate() + delta);
      return new MeetingsQuery({ ...p, from, to });
    });
  }, [setQuery, delta]);
  const today = useCallback(() => {
    setQuery((prev) => {
      const { from, to } = new MeetingsQuery();
      if (dequal(from, prev.from) && dequal(to, prev.to)) return prev;
      return new MeetingsQuery({ ...prev, from, to });
    });
  }, [setQuery]);

  return (
    <Header
      header={display === 'Day' ? dayTitle : weekTitle}
      body={t('calendar:subtitle', { name: org ? `${org.name}'s` : 'your' })}
      actions={[
        {
          label: display === 'Day' ? 'Previous day' : 'Previous week',
          onClick: prev,
        },
        {
          label: display === 'Day' ? 'Next day' : 'Next week',
          onClick: next,
        },
        {
          label: 'Today',
          onClick: today,
        },
      ]}
    />
  );
}

export default memo(CalendarHeader, dequal);
