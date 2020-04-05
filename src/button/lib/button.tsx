import React from 'react'
import { Button as MDCButton, ButtonProps as MDCButtonProps } from '@rmwc/button'

import Arrow from './arrow'

import styles from './button.module.scss'

interface ButtonProps extends MDCButtonProps {
  className: string;
  arrow: boolean;
}

export default function Button(props: ButtonProps) {
  return (
    <MDCButton {...props} className={styles.button + ' ' + props.className}>
      {props.children}
      {props.arrow ? <Arrow className={styles.buttonArrow} /> : undefined}
    </MDCButton>
  );
}
