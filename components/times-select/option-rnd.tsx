import React, { useMemo } from 'react';

import { Timeslot } from 'lib/model';

import { getHeight, getPosition } from './utils';
import styles from './option-rnd.module.scss';

interface OptionRndProps {
  value: Timeslot;
  width?: number;
}

export default function OptionRnd({
  value,
  width = 82,
}: OptionRndProps): JSX.Element {
  const position = useMemo(() => getPosition(value, width), [value, width]);
  const height = useMemo(() => getHeight(value), [value]);

  const style = useMemo(
    () => ({
      top: position.y,
      left: position.x,
      height: `${height}px`,
      width: `${width - 1}px`,
    }),
    [position, height, width]
  );

  return <div className={styles.option} style={style} />;
}
