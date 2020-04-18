import React from 'react';
import {
  Button as MDCButton,
  ButtonProps as MDCButtonProps,
  ButtonHTMLProps,
} from '@rmwc/button';

import Arrow from './arrow';

import styles from './button.module.scss';

interface UniqueButtonProps {
  arrow?: boolean;
}

type ButtonProps = UniqueButtonProps & MDCButtonProps & ButtonHTMLProps;

export default function Button(props: ButtonProps) {
  const { arrow, className, children, ...rest } = props;
  const buttonClass: string =
    styles.button +
    (className ? ' ' + className : '') +
    (arrow ? ' ' + styles.buttonWithArrow : '');
  return (
    <MDCButton {...rest} className={buttonClass}>
      {children}
      {arrow && <Arrow className={styles.buttonArrow} />}
    </MDCButton>
  );
}
