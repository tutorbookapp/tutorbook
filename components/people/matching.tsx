import React, { useState, useCallback } from 'react';
import Result from 'components/search/result';
import Utils from 'lib/utils';

import useSWR from 'swr';
import useMeasure from 'react-use-measure';
import useTranslation from 'next-translate/useTranslation';

import { useUser } from 'lib/account';
import { useSpring, animated } from 'react-spring';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import { IconButton } from '@rmwc/icon-button';
import {
  Availability,
  Aspect,
  FCallback,
  UsersQuery,
  User,
  UserJSON,
} from 'lib/model';

import styles from './matching.module.scss';

interface MatchingResultProps {
  id: string;
  setQuery: FCallback<UsersQuery>;
}

function MatchingResult({ id, setQuery }: MatchingResultProps): JSX.Element {
  const { data: user } = useSWR<UserJSON>(`/api/users/${id}`);
  const { lang: locale } = useTranslation();
  const onClick = useCallback(async () => {
    if (!user) return;
    const stringToOption = (str: string) => ({ label: str, value: str });
    let aspect: Aspect = 'mentoring';
    /* eslint-disable-next-line no-return-assign */
    setQuery(
      (prev) =>
        new UsersQuery({
          ...prev,
          subjects: user[(aspect = prev.aspect)].searches.map(stringToOption),
          availability: Availability.fromJSON(user.availability),
          langs: user.langs.map(stringToOption),
          visible: true,
          query: '',
          tags: [],
          page: 0,
        })
    );
    const langs = await Utils.langsToOptions(user.langs, locale);
    const subjects = await Utils.subjectsToOptions(user[aspect].searches);
    setQuery((prev) => new UsersQuery({ ...prev, subjects, langs }));
  }, [user, setQuery, locale]);

  return (
    <Result
      user={user ? User.fromJSON(user) : new User()}
      onClick={onClick}
      loading={!user}
      avatar={false}
    />
  );
}

interface MatchingProps {
  users: string[];
  setQuery: FCallback<UsersQuery>;
}

export default function Matching({
  users,
  setQuery,
}: MatchingProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [ref, { height }] = useMeasure({ polyfill });
  const toggle = useCallback(() => setCollapsed((prev: boolean) => !prev), []);
  const props = useSpring({
    height: collapsed ? 0 : height,
    config: { tension: 250, friction: 32, clamp: true },
  });

  const { updateUser } = useUser();
  const clear = useCallback(() => {
    setCollapsed(true);
    return updateUser((prev) => ({ ...prev, matching: [] }));
  }, [updateUser]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <IconButton
          onClick={toggle}
          className={styles.btn}
          icon={collapsed ? 'expand_less' : 'expand_more'}
        />
        <IconButton onClick={clear} className={styles.btn} icon='close' />
      </div>
      <animated.div style={{ overflow: 'hidden', ...props }}>
        <div ref={ref} className={styles.content}>
          {users.map((id: string) => (
            <MatchingResult id={id} setQuery={setQuery} />
          ))}
        </div>
      </animated.div>
    </div>
  );
}
