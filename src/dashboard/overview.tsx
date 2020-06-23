import { useUser } from '@tutorbook/account';

import React from 'react';
import Title from './title';
import Placeholder from './placeholder';

export default function Overview(): JSX.Element {
  const { user } = useUser();

  return (
    <>
      <Title
        header='Overview'
        body={`Analytics dashboard for ${user.name}`}
        actions={[
          {
            label: 'View search',
            href: '/search/[[...slug]]',
            as: '/search',
          },
        ]}
      />
      <Placeholder>COMING SOON</Placeholder>
    </>
  );
}
