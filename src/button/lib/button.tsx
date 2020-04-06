import React from 'react'
import { Button as MDCButton, ButtonProps as MDCButtonProps } from '@rmwc/button'

import Arrow from './arrow'

import styles from './button.module.scss'

interface ButtonProps extends MDCButtonProps {
  className: string;
  arrow: boolean;
}

export default function Button(props: ButtonProps) {
  const { arrow, className, children, ...rest } = props;
  return (
    <MDCButton 
      {...rest} 
      className={styles.button + (className ? ' ' + className : '')}
    >
      {children}
      {arrow ? <Arrow className={styles.buttonArrow} /> : undefined}
    </MDCButton>
  );
}
