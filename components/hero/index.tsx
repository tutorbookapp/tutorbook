import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import Carousel from 'components/carousel';
import { RequestDialogProps } from 'components/request-dialog';
import Title from 'components/title';

import { User, UsersQuery } from 'lib/model';

import SearchForm from './search-form';
import styles from './hero.module.scss';

const RequestDialog = dynamic<RequestDialogProps>(() =>
  import('components/request-dialog')
);

export default function Hero(): JSX.Element {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState<User | undefined>();
  const onClosed = useCallback(() => setViewing(undefined), []);
  const subjects = useMemo(() => [], []);
  const query = useMemo(
    () => new UsersQuery({ aspect: 'mentoring', visible: true }),
    []
  );
  return (
    <div data-cy='hero' className={styles.hero}>
      <div className={styles.wrapper}>
        {!!viewing && (
          <RequestDialog
            user={viewing}
            aspect={query.aspect}
            onClosed={onClosed}
            subjects={subjects}
          />
        )}
        <div className={styles.title}>
          <Title>{t(`about:hero-title`)}</Title>
        </div>
        <div className={styles.card}>
          <SearchForm />
        </div>
        <Carousel query={query} onClick={setViewing} />
      </div>
    </div>
  );
}
