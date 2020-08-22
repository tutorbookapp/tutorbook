import { useCallback } from 'react';
import { animated, useSpring } from 'react-spring';
import { Chip, ChipSet } from '@rmwc/chip';
import { Ripple } from '@rmwc/ripple';
import { Icon } from '@rmwc/icon';
import cn from 'classnames';

import Utils from 'lib/utils';
import { Callback, RequestJSON } from 'lib/model';

import styles from './request-item.module.scss';

export interface RequestItemProps {
  request?: RequestJSON;
  loading?: boolean;
  checked?: boolean;
  setChecked?: Callback<boolean>;
}

export default function RequestItem({
  request,
  loading,
  checked,
  setChecked,
}: RequestItemProps): JSX.Element {
  const onClick = useCallback(() => {
    if (setChecked) setChecked((prev) => !prev);
  }, [setChecked]);

  const props = useSpring({
    transform: `translateX(${checked ? 48 : 0}px)`,
    borderTopLeftRadius: `${checked ? 12 : 0}px`,
    borderBottomLeftRadius: `${checked ? 12 : 0}px`,
  });

  return (
    <li className={cn(styles.item, { [styles.loading]: loading })}>
      <Icon className={styles.checkmark} icon='checkmark' />
      <Ripple disabled={loading} onClick={onClick}>
        <animated.div style={props} className={styles.display}>
          <div className={styles.name}>
            {request && Utils.join(request.people.map((p) => p.name))}
          </div>
          <div className={styles.bio}>{request && request.message}</div>
          <div className={styles.subjectsScroller}>
            <ChipSet className={styles.subjects}>
              {request &&
                request.subjects.map((subject: string) => (
                  <Chip key={subject} className={styles.subject}>
                    {subject}
                  </Chip>
                ))}
            </ChipSet>
          </div>
        </animated.div>
      </Ripple>
    </li>
  );
}
