import Placeholder from 'components/placeholder';

import { Meeting } from 'lib/model';

import styles from './new-meeting.module.scss';

export interface NewMeetingDialogProps {
  meeting: Meeting;
}

export default function NewMeetingDialog({
  meeting,
}: NewMeetingDialogProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <Placeholder>CREATE MEETING</Placeholder>
    </div>
  );
}
