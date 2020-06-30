import React from 'react';

import { Aspect, User, UserJSON } from 'lib/model';

import useSWR from 'swr';
import { v4 as uuid } from 'uuid';

import Carousel from './carousel';
import { UserCard, LoadingCard } from './cards';

interface Props {
  aspect: Aspect;
  onClick: (user: User) => void;
}

export default function UserCarousel({ aspect, onClick }: Props): JSX.Element {
  const { data: users } = useSWR<UserJSON[]>(`/api/users?aspect=${aspect}`);
  return (
    <>
      {users && (
        <Carousel>
          {users
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
      {!users && (
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
