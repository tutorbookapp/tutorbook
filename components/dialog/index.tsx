import { animated, useSprings } from 'react-spring';
import { IconButton } from '@rmwc/icon-button';
import Link from 'next/link';
import cn from 'classnames';

import Loader from 'components/loader';

import { Callback } from 'lib/model/callback';

import { NavContext, useNav } from './context';
import styles from './dialog.module.scss';

interface DialogContentProps {
  active: number;
  setActive: Callback<number>;
  loading?: boolean;
  checked?: boolean;
  children: JSX.Element[];
  nestedPages?: number[];
  link?: string;
}

/**
 * Wrapper around the MDCDialog component that provides multi-page navigation
 * animations using the Web Animations API. All other params not listed below
 * will be passed to the MDCDialog component itself.
 *
 * Animations were determined by following Material Design guidelines:
 * @see {@link https://material.io/design/motion/the-motion-system.html#shared-axis}
 * @see {@link https://material.io/develop/web/components/animation}
 * @see {@link https://bit.ly/2EHiyDj}
 *
 * @param children - The different pages within the app. The first page always
 * has to be the display page (i.e. the page from which you close the dialog).
 * @param loading - Whether or not a loader (that prevents user input) is shown
 * on top of the entire dialog.
 * @param active - The index of the active page. Must be within the range of
 * indices provided by `children`.
 */
export default function DialogContent({
  active,
  setActive,
  loading,
  checked,
  children,
  nestedPages = [],
  link,
}: DialogContentProps): JSX.Element {
  const springs = useSprings(
    children.length,
    children.map((child, idx) => {
      const transform = idx === 0 ? 'scale(1.1)' : 'scale(0.8)';
      return {
        opacity: idx === active ? 1 : 0,
        transform: idx === active ? 'scale(1.0)' : transform,
        config: { tension: 400, clamp: true },
      };
    })
  );
  const nav = useNav();

  return (
    <div className={styles.pages}>
      {children.map((page, idx) => (
        <animated.div
          key={idx}
          style={springs[idx]}
          className={cn(styles.page, { [styles.active]: active === idx })}
        >
          <div className={styles.wrapper}>
            <Loader active={!!loading} checked={!!checked} />
            {!nestedPages.includes(idx) && (
              <div className={styles.nav}>
                <IconButton
                  icon='close'
                  className={styles.btn}
                  onClick={() => (idx === 0 ? nav() : setActive(0))}
                />
                {link && (
                  <Link href={link}>
                    <IconButton icon='open_in_new' className={styles.btn} />
                  </Link>
                )}
              </div>
            )}
            <NavContext.Provider value={() => setActive(0)}>
              {page}
            </NavContext.Provider>
          </div>
        </animated.div>
      ))}
    </div>
  );
}
