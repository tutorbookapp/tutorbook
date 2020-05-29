import { User } from '@tutorbook/model';
import { TextField } from '@rmwc/textfield';

import Button from '@tutorbook/button';
import TimeslotInput from '@tutorbook/timeslot-input';
import SubjectSelect from '@tutorbook/subject-select';

import styles from './preview.module.scss';

export default function UserPreview({
  user,
  className,
}: {
  user: User;
  className: string;
}): JSX.Element {
  return (
    <div className={styles.wrapper + (className ? ' ' + className : '')}>
      <div className={styles.left}>
        <a className={styles.imgLink} href={user.photo} target='_blank'>
          <img
            className={styles.img}
            src={user.photo}
            width='100'
            height='100'
          />
        </a>
        <h4 className={styles.name}>{user.name}</h4>
        <div className={styles.socials}>
          <a
            href='mailto:lukehsiao@gmail.com'
            className={styles.socialLink + ' ' + styles.email}
          />
          <a
            href='https://github.com/lukehsiao'
            className={styles.socialLink + ' ' + styles.github}
          />
          <a
            href='https://linkedin.com/in/lukehsiao'
            className={styles.socialLink + ' ' + styles.linkedin}
          />
          <a
            href='https://facebook.com/lukehsiao'
            className={styles.socialLink + ' ' + styles.facebook}
          />
        </div>
      </div>
      <div className={styles.right}>
        <h6 className={styles.bioHeader}>About</h6>
        <p className={styles.bio}>{user.bio}</p>
        <h6 className={styles.requestHeader}>Request</h6>
        <form className={styles.form}>
          <SubjectSelect
            outlined
            required
            label='Subjects'
            className={styles.formField}
          />
          <TimeslotInput
            outlined
            required
            label='Time'
            className={styles.formField}
          />
          <TextField
            outlined
            textarea
            rows={4}
            label='Topic'
            className={styles.formField}
          />
          <Button className={styles.btn} label='Send request' raised arrow />
        </form>
      </div>
    </div>
  );
}
