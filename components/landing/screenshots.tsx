import Link from 'next/link';
import { useState } from 'react';

import Tabs from 'components/navigation/tabs';
import Window from 'components/window';

import styles from './screenshots.module.scss';

interface Preview {
  label: string;
  id: string;
  url: string;
}

const previews = [
  {
    label: 'Landing pages',
    id: 'landing',
    url: '/default',
  },
  {
    label: 'Profile forms',
    id: 'profile',
    url: '/default/signup',
  },
  {
    label: 'Search views',
    id: 'search',
    url: '/default/search',
  },
  {
    label: 'Match scheduling',
    id: 'scheduling',
    url: '/default/users/2SLcWTl1DxbgJzFGGAUghtcJuAl2',
  },
];

export default function Screenshots(): JSX.Element {
  const [active, setActive] = useState<Preview>(previews[2]);

  return (
    <div className={styles.features}>
      <div className={styles.wrapper}>
        <div className={styles.tabs}>
          <Tabs
            tabs={previews.map((preview) => ({
              label: preview.label,
              onClick: () => setActive(preview),
              active: active.id === preview.id,
            }))}
          />
        </div>
        <div className={styles.window}>
          <Window title={active.label} url={active.url} />
        </div>
        <div className={styles.orgs}>
          <Link href='/gunn'>
            <a className={styles.org}>Gunn High School</a>
          </Link>
          <Link href='/quarantunes'>
            <a className={styles.org}>QuaranTunes</a>
          </Link>
          <Link href='/epatt'>
            <a className={styles.org}>EPATT</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
