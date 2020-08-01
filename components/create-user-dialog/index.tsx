import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from 'react';
import useTranslation from 'next-translate/useTranslation';
import useSWR from 'swr';
import cn from 'classnames';

import { Dialog } from '@rmwc/dialog';
import { User, UserJSON, SocialInterface } from 'lib/model';
import { v4 as uuid } from 'uuid';

import DisplayPage from './display-page';
import RequestPage from './request-page';
import EditPage from './edit-page';

import styles from './create-user-dialog.module.scss';

type Page = 'edit' | 'display' | 'request';

export interface UserDialogProps {
  id?: string;
  initialData?: UserJSON;
  onClosed: () => void;
  page?: Page;
}

function usePrevious<T>(value: T): T {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current as T;
}

// This wrapper component merely manages the navigation transitions between it's
// children. The default visible page is the `DisplayPage` but that can be
// configured via the `page` prop.
export default function UserDialog({
  id,
  onClosed,
  initialData = new User().toJSON(),
  page = 'display',
}: UserDialogProps): JSX.Element {
  // Temporary ID that is used to locally mutate SWR data (without calling API).
  // @see {@link https://github.com/vercel/swr/issues/576}
  const tempId = useMemo(() => uuid(), []);
  const { data, mutate } = useSWR<UserJSON>(id ? `/api/users/${id}` : tempId, {
    initialData,
  });
  const user = data as UserJSON;

  const [animating, setAnimating] = useState<boolean>(false);
  const [active, setActive] = useState<Page>(page);
  const prevActive = usePrevious<Page>(active);

  //useLayoutEffect(() => {
  //setAnimating(true);
  //setTimeout(() => setAnimating(false), 2400);
  //}, [active]);

  const displayPageClass = useMemo(() => {
    const modifiers: string[] = [''];
    if (active === 'display') {
      modifiers.push('--incoming-fade-out');
    } else if (prevActive === 'display') {
      modifiers.push('--outgoing-fade-in');
    } else {
      modifiers.push('--hidden');
    }
    return modifiers.map((m) => styles[`page${m}`]).join(' ');
  }, [active, prevActive]);
  const editPageClass = useMemo(() => {
    const modifiers: string[] = [''];
    if (active === 'edit') {
      modifiers.push('--incoming-fade-in');
    } else if (prevActive === 'edit') {
      modifiers.push('--outgoing-fade-out');
    } else {
      modifiers.push('--hidden');
    }
    return modifiers.map((m) => styles[`page${m}`]).join(' ');
  }, [active, prevActive]);
  const requestPageClass = useMemo(() => {
    const modifiers: string[] = [''];
    if (active === 'request') {
      modifiers.push('--incoming-fade-in');
    } else if (prevActive === 'request') {
      modifiers.push('--outgoing-fade-out');
    } else {
      modifiers.push('--hidden');
    }
    return modifiers.map((m) => styles[`page${m}`]).join(' ');
  }, [active, prevActive]);

  return (
    <Dialog
      open
      onClosed={onClosed}
      className={cn(styles.dialog, { [styles.animating]: animating })}
    >
      <div className={displayPageClass}>
        <DisplayPage
          value={user}
          openEdit={() => setActive('edit')}
          openRequest={() => setActive('request')}
          openMatch={() => console.log('TODO')}
        />
      </div>
      <div className={editPageClass}>
        <EditPage
          value={user}
          onChange={(updated: UserJSON) => mutate(updated, false)}
          openDisplay={() => setActive('display')}
        />
      </div>
      <div className={requestPageClass}>
        <RequestPage value={user} openDisplay={() => setActive('display')} />
      </div>
    </Dialog>
  );
}
