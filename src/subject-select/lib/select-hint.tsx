import React, { FC } from 'react';
import { Typography } from '@rmwc/typography';
import { Tooltip } from '@rmwc/tooltip';
import { Icon } from '@rmwc/icon';

import styles from './select-hint.module.scss';

interface SelectHintProps {
  readonly children: JSX.Element;
}

export const SelectHint: FC<SelectHintProps> = ({ children }) => (
  <Tooltip
    content={
      <div className={styles.messageBox}>
        <Typography use='caption' className={styles.messageText}>
          Use 'SHIFT + click' for multiple select
        </Typography>
        <Icon icon={{ icon: 'info', size: 'xsmall' }} />
      </div>
    }
    align='topRight'
    activateOn='click'
    showArrow
  >
    {children}
  </Tooltip>
);
