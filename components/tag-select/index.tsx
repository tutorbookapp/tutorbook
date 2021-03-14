import useTranslation from 'next-translate/useTranslation';

import SearchSelect, { SearchSelectProps } from 'components/search-select';

import { MatchHitTag } from 'lib/model/match';
import { MeetingHitTag } from 'lib/model/meeting';
import { UserHitTag } from 'lib/model/user';

export type TagSelectProps<
  T extends UserHitTag | MatchHitTag | MeetingHitTag
> = Omit<SearchSelectProps<T>, 'index' | 'noResultsMessage' | 'ref'>;

// TODO: We can't yet use TypeScript generics *and* `React.memo` so this
// component is going to be left un-optimized for now.
// @see {@link https://github.com/facebook/react/issues/21003}
export default function TagSelect<
  T extends UserHitTag | MatchHitTag | MeetingHitTag
>(props: TagSelectProps<T>): JSX.Element {
  const { t } = useTranslation();
  return (
    <SearchSelect
      {...props}
      index='tags'
      noResultsMessage={t('common:no-tags')}
    />
  );
}
