import React from 'react';
import Title from './title';
import Placeholder from './placeholder';

import { Org } from '@tutorbook/model';

interface OverviewProps {
  org: Org;
}

export default function Overview({ org }: OverviewProps): JSX.Element {
  return (
    <>
      <Title
        header='Overview'
        body={`Analytics dashboard for ${org.name}`}
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
