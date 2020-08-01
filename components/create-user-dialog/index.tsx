import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react';
import useWebAnimations from '@wellyshen/use-web-animations';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';
import cn from 'classnames';

import { Dialog } from '@rmwc/dialog';
import { User, UserJSON } from 'lib/model';
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

// Animation durations and easing from the MWC spec and Sass implementation.
// @see {@link https://material.io/design/motion/the-motion-system.html#shared-axis}
// @see {@link https://material.io/develop/web/components/animation}
// @see {@link https://bit.ly/2EHiyDj}
const duration = 300;
const easing = 'cubic-bezier(.4, 0, .2, 1)';

// Animation for incoming page (i.e. the nested page) when navigating downward
// from parent page to a nested page.
const incomingFadeIn = {
  keyframes: [
    { opacity: 0, transform: 'scale(0.8)' },
    { opacity: 1, transform: 'scale(1.0)' },
  ],
  timing: { duration, easing },
};

// Animation for outgoing page (i.e. the parent page) when navigating downward
// from parent page to a nested page.
const outgoingFadeIn = {
  keyframes: [
    { opacity: 1, transform: 'scale(1.0)' },
    { opacity: 0, transform: 'scale(1.1)' },
  ],
  timing: { duration, easing },
};

// Animation for incoming page (i.e. the parent page) when navigating from a
// nested page to it's parent page. This is the exact inverse of the
// `outgoing-fade-in` keyframes.
const incomingFadeOut = {
  keyframes: [
    { opacity: 0, transform: 'scale(1.1)' },
    { opacity: 1, transform: 'scale(1.0)' },
  ],
  timing: { duration, easing },
};

// Animation for outgoing page (i.e. the nested page) when navigating from a
// nested page to it's parent page. This is the exact inverse of the
// `incoming-fade-in` keyframes.
const outgoingFadeOut = {
  keyframes: [
    { opacity: 1, transform: 'scale(1.0)' },
    { opacity: 0, transform: 'scale(0.8)' },
  ],
  timing: { duration, easing },
};

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

  const [pagesMeasureRef, { height: pagesHeight }] = useMeasure();
  const [displayMeasureRef, { height: displayHeight }] = useMeasure();
  const [editMeasureRef, { height: editHeight }] = useMeasure();
  const [requestMeasureRef, { height: requestHeight }] = useMeasure();

  const { ref: displayAnimRef, animate: animateDisplay } = useWebAnimations();
  const { ref: editAnimRef, animate: animateEdit } = useWebAnimations();
  const { ref: requestAnimRef, animate: animateRequest } = useWebAnimations();

  const [active, setActive] = useState<Page>(page);
  const prevActive = usePrevious<Page>(active);

  // Prevents jumping based on page overflow. Some pages don't need a scroller
  // (while some do). When the current page doesn't have a scroller itself, we
  // add an invisible "scroller" which ensures that the dialog content area
  // isn't resized when transitioning to a page that **does** have a scroller.
  const [scroller, setScroller] = useState<boolean>(true);

  useLayoutEffect(() => {
    let updated = true;
    if (active === 'display') updated = displayHeight < pagesHeight;
    if (active === 'edit') updated = editHeight < pagesHeight;
    if (active === 'request') updated = requestHeight < pagesHeight;
    setScroller((prev: boolean) => {
      if (!prev && updated) return updated;
      setTimeout(() => setScroller(updated), duration);
      return prev;
    });
  }, [active, displayHeight, editHeight, requestHeight, pagesHeight]);

  useLayoutEffect(() => {
    switch (active) {
      case 'edit':
        animateEdit(incomingFadeIn);
        animateDisplay(outgoingFadeIn);
        break;
      case 'request':
        animateRequest(incomingFadeIn);
        animateDisplay(outgoingFadeIn);
        break;
      default:
        animateDisplay(incomingFadeOut);
        (prevActive === 'edit' ? animateEdit : animateRequest)(outgoingFadeOut);
        break;
    }
  }, [active, prevActive, animateDisplay, animateEdit, animateRequest]);

  const openEdit = useCallback(() => setActive('edit'), []);
  const openRequest = useCallback(() => setActive('request'), []);
  const openDisplay = useCallback(() => setActive('display'), []);
  const openMatch = useCallback(() => console.log('TODO'), []);

  return (
    <Dialog open onClosed={onClosed} className={styles.dialog}>
      <div className={styles.scroller} />
      <div className={styles.pages} ref={pagesMeasureRef}>
        <div
          className={cn(styles.page, {
            [styles.scrollable]: !scroller && active === 'display',
            [styles.active]: active === 'display',
          })}
          ref={displayAnimRef as React.RefObject<HTMLDivElement>}
        >
          <div ref={displayMeasureRef}>
            <DisplayPage
              value={user}
              openEdit={openEdit}
              openRequest={openRequest}
              openMatch={openMatch}
            />
          </div>
        </div>
        <div
          className={cn(styles.page, {
            [styles.scrollable]: !scroller && active === 'edit',
            [styles.active]: active === 'edit',
          })}
          ref={editAnimRef as React.RefObject<HTMLDivElement>}
        >
          <div ref={editMeasureRef}>
            <EditPage value={user} mutate={mutate} openDisplay={openDisplay} />
          </div>
        </div>
        <div
          className={cn(styles.page, {
            [styles.scrollable]: !scroller && active === 'request',
            [styles.active]: active === 'request',
          })}
          ref={requestAnimRef as React.RefObject<HTMLDivElement>}
        >
          <div ref={requestMeasureRef}>
            <RequestPage value={user} openDisplay={openDisplay} />
          </div>
        </div>
      </div>
      {scroller && <div className={styles.scroller} />}
    </Dialog>
  );
}
