import { animated, useSprings } from 'react-spring';
import cn from 'classnames';

import styles from './dialog.module.scss';

interface DialogContentProps {
  page: number;
  children: JSX.Element[];
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
 * @param page - The index of the page page. Must be within the range of
 * indices provided by `children`.
 */
export default function DialogContent({
  page,
  children,
}: DialogContentProps): JSX.Element {
  const springs = useSprings(
    children.length,
    children.map((child, idx) => {
      const transform = idx === 0 ? 'scale(1.1)' : 'scale(0.8)';
      return {
        opacity: idx === page ? 1 : 0,
        transform: idx === page ? 'scale(1.0)' : transform,
        config: { tension: 400, clamp: true },
      };
    })
  );

  /* eslint-disable react/no-array-index-key */
  return (
    <div className={styles.pages}>
      {children.map((child, idx) => (
        <animated.div
          key={idx}
          style={springs[idx]}
          className={cn(styles.page, { [styles.active]: page === idx })}
        >
          {child}
        </animated.div>
      ))}
    </div>
  );
  /* eslint-enable react/no-array-index-key */
}
