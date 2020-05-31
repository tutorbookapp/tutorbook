import React from 'react';
import Carousel from './carousel';

import { UserCard, LoadingCard } from './cards';
import { Aspect, User, UserJSONInterface } from '@tutorbook/model';

import axios from 'axios';
import useSWR from 'swr';

interface Props {
  aspect: Aspect;
  onClick: (user: User) => any;
}

export default function UserCarousel({ aspect, onClick }: Props): JSX.Element {
  const { data } = useSWR<User[]>(`/api/search?aspect=${aspect}`, async (url) =>
    (
      await axios.get<UserJSONInterface[]>(url)
    ).data.map((user: UserJSONInterface) => User.fromJSON(user))
  );
  return (
    <>
      {data && (
        <Carousel>
          {data.map((user: User, index: number) => (
            <UserCard
              key={user.uid || index}
              user={user}
              onClick={() => onClick(user)}
            />
          ))}
        </Carousel>
      )}
      {!data && (
        <Carousel>
          {Array(3)
            .fill(null)
            .map((_: null, index: number) => (
              <LoadingCard key={index} />
            ))}
        </Carousel>
      )}
    </>
  );
}
