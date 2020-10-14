import { useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { v4 as uuid } from 'uuid';

import { User, UserJSON, UsersQuery } from 'lib/model';
import { ListUsersRes } from 'lib/api/routes/users/list';

import Carousel from './carousel';
import { LoadingCard, UserCard } from './cards';

interface Props {
  query: UsersQuery;
  onClick: (user: User) => void;
}

export default function UserCarousel({ query, onClick }: Props): JSX.Element {
  const { data } = useSWR<ListUsersRes>(query.endpoint);

  useEffect(() => {
    void mutate(query.endpoint);
  }, [query.endpoint]);

  return (
    <>
      {data && (
        <Carousel>
          {data.users
            .map((u: UserJSON) => User.fromJSON(u))
            .map((user: User) => (
              <UserCard
                key={user.id || uuid()}
                user={user}
                onClick={() => onClick(user)}
              />
            ))}
        </Carousel>
      )}
      {!data && (
        <Carousel>
          {Array(6)
            .fill(null)
            .map(() => (
              <LoadingCard key={uuid()} />
            ))}
        </Carousel>
      )}
    </>
  );
}
