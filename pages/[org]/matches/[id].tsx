import Router, { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWR from 'swr';

import { EmptyHeader } from 'components/navigation';
import MatchDisplay from 'components/match/display';
import Page from 'components/page';

import { Match } from 'lib/model/match';
import { Meeting } from 'lib/model/meeting';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';
import { PageProps, getPagePaths, getPageProps } from 'lib/page';
import { APIError } from 'lib/api/error';
import { OrgContext } from 'lib/context/org';
import usePage from 'lib/hooks/page';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import matches from 'locales/en/matches.json';

function MatchDisplayPage(props: PageProps): JSX.Element {
  const { loggedIn } = useUser();
  const { query } = useRouter();
  const { data: org, error: orgError } = useSWR<Org, APIError>(
    typeof query.org === 'string' ? `/api/orgs/${query.org}` : null
  );
  const { data: match, error: matchError } = useSWR<Match, APIError>(
    typeof query.id === 'string' ? `/api/matches/${query.id}` : null
  );
  const { data: people, error: peopleError } = useSWR<User[], APIError>(
    typeof query.id === 'string' ? `/api/matches/${query.id}/people` : null
  );
  const { data: meetings, error: meetingsError } = useSWR<
    Meeting[],
    APIError
  >(typeof query.id === 'string' ? `/api/matches/${query.id}/meetings` : null);

  useEffect(() => {
    if (
      loggedIn &&
      [orgError, matchError, peopleError, meetingsError].some(
        (e) => e?.code === 401
      )
    ) {
      void Router.replace('/404');
    }
  }, [loggedIn, orgError, matchError, peopleError, meetingsError]);

  // TODO: Redirect to 404 page when SWR throws a 401 error.
  usePage({
    name: 'Match Display',
    url: `/${query.org as string}/matches/${query.id as string}`,
    org: query.org as string,
    login: true,
  });

  return (
    <OrgContext.Provider value={{ org: org ? Org.parse(org) : undefined }}>
      <Page title='Match - Tutorbook' {...props}>
        <EmptyHeader />
        <MatchDisplay
          match={match ? Match.parse(match) : undefined}
          people={people ? people.map((p) => User.parse(p)) : undefined}
          meetings={
            meetings ? meetings.map((m) => Meeting.parse(m)) : undefined
          }
        />
      </Page>
    </OrgContext.Provider>
  );
}

export const getStaticProps = getPageProps;
export const getStaticPaths = getPagePaths;

export default withI18n(MatchDisplayPage, { common, matches });
