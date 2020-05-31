import { Ripple } from '@rmwc/ripple';
import { User } from '@tutorbook/model';

import Avatar from '@tutorbook/avatar';
import styles from './result.module.scss';

interface Props {
  user?: User;
  onClick?: (event: React.SyntheticEvent<HTMLElement>) => any;
  loading?: boolean;
}

export default function Result({ user, onClick, loading }: Props): JSX.Element {
  const loaderClass: string = loading ? ' ' + styles.loading : '';
  return (
    <Ripple>
      <li className={styles.listItem} onClick={onClick}>
        <div className={styles.img}>
          <Avatar loading={loading} src={(user || {}).photo} />
        </div>
        <div className={styles.name + loaderClass}>{user && user.name}</div>
        <div className={styles.bio + loaderClass}>{user && user.bio}</div>
      </li>
    </Ripple>
  );
}
