import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import SearchSelect, { SearchSelectProps } from 'components/search-select';

export type TagSelectProps = Omit<
  SearchSelectProps,
  'index' | 'noResultsMessage' | 'ref'
>;

// TODO: We can't yet use TypeScript generics *and* `React.memo` so this
// component is going to be left un-optimized for now.
// @see {@link https://github.com/facebook/react/issues/21003}
export default function TagSelect({ options = [], ...props }: TagSelectProps): JSX.Element {
  const { t } = useTranslation();

  // TODO: TypeScript should know that if HitTag is UserHitTag then Tag has to
  // be UserTag (and cannot be MatchTag or MeetingTag) and vice versa.
  const selectOptions = useMemo(
    () => [
      ...options,
      ...options.map((o) => `not-${o}`),
    ],
    [options]
  );

  return (
    <SearchSelect
      {...props}
      noResultsMessage={t('common:no-tags')}
      options={selectOptions}
      autoOpenMenu
      index='tags'
    />
  );
}
