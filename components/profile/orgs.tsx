import cn from 'classnames';
import useSWR from 'swr';

import { Callback } from 'lib/model/callback';
import { ListOrgsRes } from 'lib/api/routes/orgs/list';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';

interface OrgCardProps {
  org?: Org;
}

function OrgCard({ org }: OrgCardProps): JSX.Element {
  return (
    <div className={cn('card', { loading: !org })}>
      <h3>{org?.name}</h3>
      <p>{org?.bio}</p>
      <style jsx>{`
        .card {
          padding: 24px;
        }
      `}</style>
    </div>
  );
}

export interface OrgsProps {
  user: User;
  setUser: Callback<User>;
}

export default function Orgs({ user, setUser }: OrgsProps): JSX.Element {
  const { data } = useSWR<ListOrgsRes>('/api/orgs');

  return (
    <div className='wrapper'>
      {!data &&
        Array(5)
          .fill(null)
          .map((_, idx) => <OrgCard key={idx} />)}
      {data?.map((o) => (
        <OrgCard org={Org.fromJSON(o)} key={o.id} />
      ))}
      <style jsx>{`
        .wrapper {
          max-width: var(--page-width-with-margin);
          padding: 0 24px;
          margin: 0 auto;
          display: flex;
        }
      `}</style>
    </div>
  );
}
