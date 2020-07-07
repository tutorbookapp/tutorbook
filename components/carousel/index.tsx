import React from 'react';
import useSWR from 'swr';

import { ListUsersRes } from 'lib/api/list-users';
import { Aspect, User, UserJSON } from 'lib/model';
import { v4 as uuid } from 'uuid';

import Carousel from './carousel';
import { UserCard, LoadingCard } from './cards';

interface Props {
  aspect: Aspect;
  onClick: (user: User) => void;
}

export default function UserCarousel({ aspect, onClick }: Props): JSX.Element {
  const { data } = useSWR<ListUsersRes>(`/api/users?aspect=${aspect}`);
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
