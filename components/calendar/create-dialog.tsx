import Placeholder from 'components/placeholder';

import { Meeting } from 'lib/model';

import styles from './create-dialog.module.scss';

export interface CreateDialogProps {
  meeting: Meeting;
  closePreview: () => void;
}

export default function CreateDialog({
  meeting,
}: CreateDialogProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <Placeholder>CREATE MEETING</Placeholder>
    </div>
  );
}
