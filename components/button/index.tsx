import {
  ButtonHTMLProps,
  Button as MDCButton,
  ButtonProps as MDCButtonProps,
} from '@rmwc/button';
import React from 'react';

import Arrow from './arrow';
import styles from './button.module.scss';

interface UniqueButtonProps {
  arrow?: boolean;
  google?: boolean;
}

type ButtonProps = UniqueButtonProps & MDCButtonProps & ButtonHTMLProps;

export default function Button({
  arrow,
  google,
  className,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const buttonClass: string =
    styles.button +
    (className ? ` ${className}` : '') +
    (arrow ? ` ${styles.arrowButton}` : '') +
    (google ? ` ${styles.googleButton}` : '');
  return (
    <MDCButton {...rest} className={buttonClass}>
      {google && <div className={styles.googleLogo} />}
      {children}
      {arrow && <Arrow className={styles.arrowIcon} />}
    </MDCButton>
  );
}
