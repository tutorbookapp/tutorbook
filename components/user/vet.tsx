import { useRouter } from 'next/router';

import Result from 'components/search/result';
import VerificationsTable from 'components/user/verifications';

import { User } from 'lib/model/user';

import styles from './vet.module.scss';

export interface UserVetProps {
  user?: User;
}

export default function UserVet({ user }: UserVetProps): JSX.Element {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <Result
        user={user}
        loading={!user}
        className={styles.display}
        onClick={() => router.back()}
      />
      <VerificationsTable user={user || new User()} />
    </div>
  );
}
