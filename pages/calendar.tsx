import { useCallback, useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import Calendar from 'components/calendar';
import Header from 'components/header';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { CallbackParam, Match, MatchesQuery } from 'lib/model';
import { ListMatchesRes } from 'lib/api/routes/matches/list';
import { usePage } from 'lib/hooks';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';

import matchJSON from 'cypress/fixtures/match.json';

function CalendarPage(): JSX.Element {
  usePage({ name: 'Calendar', url: '/calendar', login: true });

  const [searching, setSearching] = useState<boolean>(true);
  const [query, setQuery] = useState<MatchesQuery>();

  const onQueryChange = useCallback((param: CallbackParam<MatchesQuery>) => {
    setQuery((prev) => {
      let updated = prev || new MatchesQuery({ hitsPerPage: 10 });
      if (typeof param === 'object') updated = param;
      if (typeof param === 'function') updated = param(updated);
      if (dequal(updated, prev)) return prev;
      setSearching(true);
      return updated;
    });
  }, []);

  const { t } = useTranslation();
  const { user } = useUser();

  useEffect(() => {
    onQueryChange((prev) => {
      if (!user.id) return prev;
      const people = [{ label: user.name, value: user.id }];
      return new MatchesQuery({ ...prev, people });
    });
  }, [user, onQueryChange]);

  const { data, isValidating } = useSWR<ListMatchesRes>(
    query ? query.endpoint : null
  );

  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const [matches, setMatches] = useState<Match[]>([Match.fromJSON(matchJSON)]);

  //useEffect(() => {
  //setMatches((prev) => data?.matches.map((m) => Match.fromJSON(m)) || prev);
  //}, [data?.matches]);

  return (
    <Page title='Calendar - Tutorbook'>
      <TabHeader
        switcher
        tabs={[
          {
            label: t('common:overview'),
            href: '/dashboard',
          },
          {
            label: t('common:calendar'),
            href: '/calendar',
            active: true,
          },
          {
            label: t('common:profile'),
            href: '/profile',
          },
        ]}
      />
      <Header
        header={t('common:calendar')}
        body='Create, edit, and cancel meetings'
        actions={[
          {
            label: 'Previous week',
            href: '#',
          },
          {
            label: 'Next week',
            href: '#',
          },
          {
            label: 'Today',
            href: '#',
          },
        ]}
      />
      <Calendar
        searching={searching}
        matches={matches}
        setMatches={setMatches}
      />
    </Page>
  );
}

export default withI18n(CalendarPage, { common, match });
