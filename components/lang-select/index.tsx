import { dequal } from 'dequal/lite';
import { memo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import SearchSelect, { SearchSelectProps } from 'components/search-select';

export type LangSelectProps = Omit<
  SearchSelectProps<string>,
  'index' | 'noResultsMessage' | 'ref'
>;

function LangSelect(props: LangSelectProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <SearchSelect
      {...props}
      index='langs'
      noResultsMessage={t('common:no-langs')}
    />
  );
}

export default memo(LangSelect, dequal);
