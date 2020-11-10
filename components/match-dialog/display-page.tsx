import { Chip, ChipSet } from '@rmwc/chip';

import { Callback } from 'lib/model';

import styles from './page.module.scss';

export interface DisplayPageProps {
  setActive: Callback<number>;
}

export default function DisplayPage({
  setActive,
}: DisplayPageProps): JSX.Element {
  return (
    <>
      <div className={styles.placeholder}>DISPLAY PAGE</div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='group_add' label='Create match' />
          <Chip icon='person_add' label='Create request' />
          <Chip icon='email' label='Send email' />
          <Chip icon='edit' label='Edit profile' onClick={() => setActive(1)} />
        </ChipSet>
      </div>
    </>
  );
}
