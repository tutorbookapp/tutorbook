import { dequal } from 'dequal/lite';
import { memo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import SearchSelect, { SearchSelectProps } from 'components/search-select';

export type SubjectSelectProps = Omit<
  SearchSelectProps<string>,
  'index' | 'noResultsMessage' | 'ref'
>;

function SubjectSelect(props: SubjectSelectProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <SearchSelect
      {...props}
      index='subjects'
      noResultsMessage={t('common:no-subjects')}
    />
  );
}

export default memo(SubjectSelect, dequal);
