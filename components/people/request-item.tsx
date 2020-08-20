import { useEffect } from 'react';
import { ChipSet, Chip } from '@rmwc/chip';
import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';

import Utils from 'lib/utils';

import { RequestJSON } from 'lib/model';

import styles from './request-item.module.scss';

export interface RequestItemProps {
  request: RequestJSON;
  loading?: boolean;
  onClick: () => void;
}

export default function RequestItem({
  loading,
  onClick,
}: RequestItemProps): JSX.Element {
  const request: RequestJSON = {
    id: 'mHOhsF3WXXNmB29UrT1N',
    subjects: ['Computer Science', 'AP Computer Science A'],
    people: [
      {
        id: 'XBU0Dm0voDcvQK2k9EEWQvqX5C53',
        name: 'Scarlet Johansen',
        photo:
          'https://firebasestorage.googleapis.com/v0/b/test-covid-tutoring.appspot.com/o/test%2Ftemp%2Ffb2c6523-23ec-469a-9dfb-4841683bbf81.jpeg?alt=media&token=bd67e6ff-9fec-44a9-9d31-ac7082bbc51c',
        handle: '4e0c0444-64cc-43ef-bf1f-ac382ea183e2',
        roles: ['tutee'],
      },
      {
        id: 'zsSQBJk9NTZQqzpvKb6m3XnuMkw2',
        name: 'Paul Cox',
        photo:
          'https://firebasestorage.googleapis.com/v0/b/covid-tutoring.appspot.com/o/default%2Fusers%2FzsSQBJk9NTZQqzpvKb6m3XnuMkw2.png?alt=media&token=e822cb84-e578-49ec-94c3-853395d43f31',
        handle: 'babaa1d7-e198-47a6-9f6c-d1ca0158b5db',
        roles: ['tutee'],
      },
    ],
    creator: {
      id: 'cSmD3dPiZrY9VfNptEmPg2cEZqv1',
      name: 'Nicholas Chiang',
      photo:
        'https://lh5.googleusercontent.com/-U5BFg_wEPZw/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuclonkGE0SB9DZIe1BDloG7U18ReNA/photo.jpg',
      handle: '1453fd9f-e3a1-428a-9265-bf1cbca6bb83',
      roles: [],
    },
    status: 'queued',
    message:
      'Scarlet and Paul both seem to be struggling with arrays and other data models. It might help to give her a visualization of what those data models could represent in real life.',
  };

  return (
    <Ripple disabled={loading} onClick={onClick}>
      <li className={cn(styles.item, { [styles.loading]: loading })}>
        <div className={styles.name}>
          {Utils.join(request.people.map((p) => p.name))}
        </div>
        <div className={styles.bio}>{request.message}</div>
        <div className={styles.subjectsScroller}>
          <ChipSet className={styles.subjects}>
            {request.subjects.map((subject: string) => (
              <Chip className={styles.subject}>{subject}</Chip>
            ))}
          </ChipSet>
        </div>
      </li>
    </Ripple>
  );
}
