import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import SearchSelect, { SearchSelectProps } from 'components/search-select';

import { DBMeetingTag, MeetingTag } from 'lib/model/meeting';
import { DBUserTag, UserTag } from 'lib/model/user';

export type TagSelectProps<
  HitTag extends DBUserTag | DBMeetingTag,
  Tag extends UserTag | MeetingTag
> = Omit<
  SearchSelectProps<HitTag>,
  'index' | 'noResultsMessage' | 'options' | 'ref'
> & { options: Tag[] };

// TODO: We can't yet use TypeScript generics *and* `React.memo` so this
// component is going to be left un-optimized for now.
// @see {@link https://github.com/facebook/react/issues/21003}
export default function TagSelect<
  HitTag extends DBUserTag | DBMeetingTag,
  Tag extends UserTag | MeetingTag
>({ options, ...props }: TagSelectProps<HitTag, Tag>): JSX.Element {
  const { t } = useTranslation();

  // TODO: TypeScript should know that if HitTag is DBUserTag then Tag has to
  // be UserTag (and cannot be a MeetingTag) and vice versa.
  const selectOptions = useMemo(
    () => [
      ...(options as unknown as HitTag[]),
      ...options.map((o) => `not-${o}` as unknown as HitTag),
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
