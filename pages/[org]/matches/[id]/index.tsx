import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';

import { EmptyHeader } from 'components/navigation';
import MatchDialog from 'components/match-dialog';
import Page from 'components/page';

import { Match, MatchJSON } from 'lib/model';
import { db } from 'lib/api/firebase';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import matches from 'locales/en/matches.json';
import user from 'locales/en/user.json';

interface MatchPageProps {
  match?: MatchJSON;
}

function MatchPage({ match }: MatchPageProps): JSX.Element {
  const router = useRouter();

  return (
    <Page title='Match - Tutorbook'>
      <EmptyHeader />
      <MatchDialog onClosed={() => router.back()} initialData={match} />
    </Page>
  );
}

interface MatchPageQuery extends ParsedUrlQuery {
  id: string;
}

export const getStaticProps: GetStaticProps<
  MatchPageProps,
  MatchPageQuery
> = async (ctx: GetStaticPropsContext<MatchPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch match w/out params.');
  const doc = await db.collection('matches').doc(ctx.params.id).get();
  if (!doc.exists) throw new Error(`Match (${doc.id}) doesn't exist.`);
  return { props: { match: Match.fromFirestore(doc).toJSON() }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<MatchPageQuery> = async () => {
  return { paths: [], fallback: true };
};

export default withI18n(MatchPage, { common, match, matches, user });
