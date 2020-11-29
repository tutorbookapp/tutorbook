import { useRouter } from 'next/router';
import useSWR from 'swr';

import { EmptyHeader } from 'components/navigation';
import MatchDisplay from 'components/match/display';
import Page from 'components/page';

import {
  Match,
  MatchJSON,
  Meeting,
  MeetingJSON,
  Org,
  OrgJSON,
  User,
  UserJSON,
} from 'lib/model';
import { OrgContext } from 'lib/context/org';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import matches from 'locales/en/matches.json';

function MatchDisplayPage(): JSX.Element {
  const { query } = useRouter();
  const { data: org } = useSWR<OrgJSON>(
    typeof query.org === 'string' ? `/api/orgs/${query.org}` : null
  );
  const { data: match } = useSWR<MatchJSON>(
    typeof query.id === 'string' ? `/api/matches/${query.id}` : null
  );
  const { data: people } = useSWR<UserJSON[]>(
    typeof query.id === 'string' ? `/api/matches/${query.id}/people` : null
  );
  const { data: meetings } = useSWR<MeetingJSON[]>(
    typeof query.id === 'string' ? `/api/matches/${query.id}/meetings` : null
  );

  // TODO: Redirect to 404 page when SWR throws a 401 error.
  usePage({
    name: 'Match Display',
    url: `/${query.org as string}/matches/${query.id as string}`,
    org: query.org as string,
    login: true,
  });

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page title='Match - Tutorbook'>
        <EmptyHeader />
        <MatchDisplay
          match={match ? Match.fromJSON(match) : undefined}
          people={people ? people.map((p) => User.fromJSON(p)) : undefined}
          meetings={
            meetings ? meetings.map((m) => Meeting.fromJSON(m)) : undefined
          }
        />
      </Page>
    </OrgContext.Provider>
  );
}

export default withI18n(MatchDisplayPage, { common, match, matches });
