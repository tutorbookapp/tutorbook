import React from 'react';

import { Aspect, User, UserJSON } from '@tutorbook/model';

import axios from 'axios';
import useSWR from 'swr';
import { v4 as uuid } from 'uuid';

import Carousel from './carousel';
import { UserCard, LoadingCard } from './cards';

interface Props {
  aspect: Aspect;
  onClick: (user: User) => void;
}

export default function UserCarousel({ aspect, onClick }: Props): JSX.Element {
  const { data } = useSWR<User[]>(`/api/search?aspect=${aspect}`, async (url) =>
    (await axios.get<UserJSON[]>(url)).data.map((user: UserJSON) =>
      User.fromJSON(user)
    )
  );
  return (
    <>
      {data && (
        <Carousel>
          {data.map((user: User, index: number) => (
            <UserCard
              key={user.id || index}
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
            .map(() => (
              <LoadingCard key={uuid()} />
            ))}
        </Carousel>
      )}
    </>
  );
}
