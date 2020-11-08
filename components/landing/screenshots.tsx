import { useState } from 'react';

import Tabs from 'components/navigation/tabs';

import styles from './screenshots.module.scss';

export default function Screenshots(): JSX.Element {
  const [active, setActive] = useState<string>('search');

  return (
    <div className={styles.features}>
      <div className={styles.wrapper}>
        <div className={styles.tabs}>
          <Tabs
            tabs={[
              {
                label: 'Landing pages',
                onClick: () => setActive('landing'),
                active: active === 'landing',
              },
              {
                label: 'Profile forms',
                onClick: () => setActive('onboarding'),
                active: active === 'onboarding',
              },
              {
                label: 'Volunteer vetting',
                onClick: () => setActive('vetting'),
                active: active === 'vetting',
              },
              {
                label: 'Search views',
                onClick: () => setActive('search'),
                active: active === 'search',
              },
              {
                label: 'Match scheduling',
                onClick: () => setActive('scheduling'),
                active: active === 'scheduling',
              },
              {
                label: 'Admin dashboards',
                onClick: () => setActive('admin'),
                active: active === 'admin',
              },
            ]}
          />
        </div>
        <div className={styles.placeholder} />
        <div className={styles.orgs}>
          <span className={styles.org}>PAUSD</span>
          <span className={styles.org}>QuaranTunes</span>
          <span className={styles.org}>EPATT</span>
          <span className={styles.org}>TopDogTutors</span>
        </div>
      </div>
    </div>
  );
}
