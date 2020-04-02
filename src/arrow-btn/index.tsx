import { Button, ButtonProps } from '@rmwc/button'

import Arrow from './arrow'

import styles from './index.module.scss'

interface ArrowButtonProps extends ButtonProps {
  className: string;
}

export default function ArrowButton(props: ArrowButtonProps) {
  return (
    <Button {...props} className={styles.button + ' ' + props.className}>
      {props.children}
      <Arrow className={styles.buttonArrow} />
    </Button>
  );
}
