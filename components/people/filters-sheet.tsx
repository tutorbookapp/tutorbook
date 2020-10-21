import { memo, useCallback, useEffect, useMemo } from 'react';
import { animated, useSpring } from 'react-spring';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import LangSelect from 'components/lang-select';
import Placeholder from 'components/placeholder';
import SubjectSelect from 'components/subject-select';
import AvailabilitySelect from 'components/availability-select';

import {
  Availability,
  Callback,
  CallbackParam,
  Option,
  RequestJSON,
  UsersQuery,
} from 'lib/model';
import { ListRequestsRes } from 'lib/api/routes/requests/list';

import { config, width } from './spring-animation';
import RequestItem from './request-item';
import styles from './filters-sheet.module.scss';

export interface FiltersSheetProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  open: boolean;
  matching: RequestJSON[];
  setMatching: Callback<RequestJSON[]>;
}

export default memo(function FiltersSheet({
  query,
  setQuery,
  open,
  matching,
  setMatching,
}: FiltersSheetProps): JSX.Element {
  const props = useSpring({ config, width: open ? width : 0 });
  const loadingRows = useMemo(
    () =>
      Array(5)
        .fill(null)
        .map(() => <RequestItem key={uuid()} loading />),
    []
  );

  const { t } = useTranslation();

  // TODO: Use the `RequestsQuery` class to filter this API by the current org.
  const { isValidating, data } = useSWR<ListRequestsRes>('/api/requests');

  useEffect(() => {
    // Remove requests that don't exist (in our db) from the matching queue.
    setMatching((requests: RequestJSON[]) => {
      const fetched = data ? data.requests.map((r) => r.id) : [];
      return requests.filter((r) => fetched.includes(r.id));
    });
  }, [data, setMatching]);

  const onSubjectsChange = useCallback(
    (subjects: Option<string>[]) => {
      setQuery((prev) => new UsersQuery({ ...prev, subjects }));
    },
    [setQuery]
  );
  const onAvailabilityChange = useCallback(
    (availability: Availability) => {
      setQuery((prev) => new UsersQuery({ ...prev, availability }));
    },
    [setQuery]
  );
  const onLangsChange = useCallback(
    (langs: Option<string>[]) => {
      setQuery((prev) => new UsersQuery({ ...prev, langs }));
    },
    [setQuery]
  );

  return (
    <animated.div className={styles.wrapper} style={props}>
      <div className={styles.content} style={{ width }}>
        <h4 className={styles.header}>More filters</h4>
        <form className={styles.form}>
          <SubjectSelect
            label={t('query:subjects')}
            onSelectedChange={onSubjectsChange}
            selected={query.subjects}
            placeholder={t(`common:${query.aspect}-subjects-placeholder`)}
            aspect={query.aspect}
            className={styles.field}
            outlined
          />
          <AvailabilitySelect
            label={t('query:availability')}
            onChange={onAvailabilityChange}
            value={query.availability}
            className={styles.field}
            outlined
          />
          <LangSelect
            label={t('query:langs')}
            onSelectedChange={onLangsChange}
            selected={query.langs}
            className={styles.field}
            outlined
          />
        </form>
        <h4 className={styles.header}>Queued requests</h4>
        <div className={styles.list}>
          {isValidating && !data && loadingRows}
          {!isValidating && data && !data.hits && (
            <div className={styles.empty}>
              <Placeholder>{t('people:requests-empty')}</Placeholder>
            </div>
          )}
          {data &&
            data.requests.map((request: RequestJSON) => (
              <RequestItem
                key={request.id}
                checked={matching.findIndex((r) => r.id === request.id) >= 0}
                setChecked={(param: CallbackParam<boolean>) => {
                  let checked = false;
                  const idx = matching.findIndex((r) => r.id === request.id);
                  if (typeof param === 'function') checked = param(idx >= 0);
                  if (typeof param === 'boolean') checked = param;
                  if (checked) {
                    setMatching([...matching, request]);
                  } else {
                    setMatching([
                      ...matching.slice(0, idx),
                      ...matching.slice(idx + 1),
                    ]);
                  }
                }}
                request={request}
              />
            ))}
        </div>
      </div>
    </animated.div>
  );
});
