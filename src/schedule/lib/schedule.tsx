import React from 'react';
import { NotchedOutline } from '@rmwc/notched-outline';
import { FloatingLabel } from '@rmwc/floating-label';

import styles from './schedule.module.scss';

export default class Schedule extends React.Component {
  render() {
    return (
      <NotchedOutline className={styles.schedule}>
        <FloatingLabel float={true} shake={false}>
          Schedule
        </FloatingLabel>
      </NotchedOutline>
    );
  }
}
