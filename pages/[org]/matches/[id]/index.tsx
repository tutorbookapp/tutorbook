import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
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
import getMatch from 'lib/api/get/match';
import getMeetings from 'lib/api/get/meetings';
import getOrg from 'lib/api/get/org';
import getTruncatedUser from 'lib/api/get/truncated-user';
import getUser from 'lib/api/get/user';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import matches from 'locales/en/matches.json';

interface MatchPageProps {
  org?: OrgJSON;
  match?: MatchJSON;
  people?: UserJSON[];
  meetings?: MeetingJSON[];
}

// TODO: Create `/api/matches/[id]/people` endpoint and use SWR for all of these
// match page data props. This will also show full user data for admins.
function MatchPage({
  org,
  match: initialMatch,
  people: initialPeople,
  meetings: initialMeetings,
}: MatchPageProps): JSX.Element {
  const { query } = useRouter();
  const { data: match } = useSWR<MatchJSON>(
    typeof query.id === 'string' ? `/api/matches/${query.id}` : null,
    { initialData: initialMatch, revalidateOnMount: true }
  );
  const { data: people } = useSWR<UserJSON[]>(
    typeof query.id === 'string' ? `/api/matches/${query.id}/people` : null,
    { initialData: initialPeople, revalidateOnMount: true }
  );
  const { data: meetings } = useSWR<MeetingJSON[]>(
    typeof query.id === 'string' ? `/api/matches/${query.id}/meetings` : null,
    { initialData: initialMeetings, revalidateOnMount: true }
  );

  usePage({ name: 'Match Home', org: org?.id, login: true });

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

interface MatchPageQuery extends ParsedUrlQuery {
  org: string;
  id: string;
}

// TODO: Also send meetings in static props to pre-generate timeline.
// TODO: Don't completely error if a user doesn't exist or something like that.
export const getStaticProps: GetStaticProps<
  MatchPageProps,
  MatchPageQuery
> = async (ctx: GetStaticPropsContext<MatchPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch match w/out params.');
  try {
    const [org, match, meetings] = await Promise.all([
      getOrg(ctx.params.org),
      getMatch(ctx.params.id),
      getMeetings(ctx.params.id),
    ]);
    const people = await Promise.all(match.people.map((p) => getUser(p.id)));
    return {
      props: {
        org: org.toJSON(),
        match: match.toJSON(),
        people: people.map((p) => getTruncatedUser(p).toJSON()),
        meetings: meetings.map((m) => m.toJSON()),
      },
      revalidate: 1,
    };
  } catch (e) {
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths<MatchPageQuery> = async () => {
  return { paths: [], fallback: true };
};

export default withI18n(MatchPage, { common, match, matches });
