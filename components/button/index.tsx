import {
  ButtonHTMLProps,
  Button as MDCButton,
  ButtonProps as MDCButtonProps,
} from '@rmwc/button';
import Link from 'next/link';
import { useMemo } from 'react';
import cn from 'classnames';

import GoogleIcon from 'components/icons/google';

import Arrow from './arrow';
import styles from './button.module.scss';

interface UniqueButtonProps {
  arrow?: boolean;
  google?: boolean;
  href?: string;
}

type ButtonProps = UniqueButtonProps & MDCButtonProps & ButtonHTMLProps;

export default function Button({
  arrow,
  google,
  className,
  children,
  href,
  ...rest
}: ButtonProps): JSX.Element {
  const button = useMemo(
    () => (
      <MDCButton
        {...rest}
        className={cn(styles.button, className, {
          [styles.arrowButton]: arrow,
          [styles.googleButton]: google,
        })}
      >
        {google && (
          <div className={styles.googleLogo}>
            <GoogleIcon />
          </div>
        )}
        {children}
        {arrow && <Arrow className={styles.arrowIcon} />}
      </MDCButton>
    ),
    [className, arrow, google, children, rest]
  );

  return !href ? (
    button
  ) : (
    <Link href={href}>
      <a className={styles.link}>{button}</a>
    </Link>
  );
}
