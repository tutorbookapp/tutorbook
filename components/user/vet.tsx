import Result from 'components/search/result';
import VerificationsTable from 'components/user/verifications';

import { User } from 'lib/model';
import { useOrg } from 'lib/context/org';

import styles from './vet.module.scss';

export interface UserVetProps {
  user?: User;
}

export default function UserVet({ user }: UserVetProps): JSX.Element {
  const { org } = useOrg();

  return (
    <div className={styles.wrapper}>
      <Result
        user={user}
        loading={!user}
        className={styles.display}
        href={`/${org?.id || ''}/users/${user?.id || ''}`}
      />
      <VerificationsTable user={user || new User()} />
    </div>
  );
}
