import { Card, CardPrimaryAction, CardMedia } from '@rmwc/card';
import { User, Aspect } from '@tutorbook/model';
import { Link } from '@tutorbook/intl';

import styles from './user-card.module.scss';

interface UserCardProps {
  aspect: Aspect;
  user: User;
}

export default function UserCard({ user, aspect }: UserCardProps): JSX.Element {
  return (
    <Card className={styles.card}>
      <Link href={`/search/${user.uid}`}>
        <CardPrimaryAction>
          <CardMedia sixteenByNine className={styles.media} />
          <div className={styles.content}>
            <h6 className={styles.title}>{user.name}</h6>
            <p className={styles.body}>{user.bio}</p>
          </div>
        </CardPrimaryAction>
      </Link>
    </Card>
  );
}
