import React, { useEffect } from 'react';
import useSWR, { mutate } from 'swr';

import { ListUsersRes } from 'lib/api/list-users';
import { Query, User, UserJSON } from 'lib/model';
import { v4 as uuid } from 'uuid';

import Carousel from './carousel';
import { UserCard, LoadingCard } from './cards';

interface Props {
  query: Query;
  onClick: (user: User) => void;
}

export default function UserCarousel({ query, onClick }: Props): JSX.Element {
  const { data } = useSWR<ListUsersRes>(query.endpoint);

  useEffect(() => mutate(query.endpoint), [query.endpoint]);

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
