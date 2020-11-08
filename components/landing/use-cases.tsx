import styles from './use-cases.module.scss';

export default function UseCases(): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <h4>Distribute your workflow</h4>
      <p>
        Tutorbook enables everyone to manage their part, making your job easier.
      </p>
      <div className={styles.grid}>
        <div className={styles.item}>
          <h5>Students</h5>
          <p>Search volunteers</p>
          <p>Schedule meetings</p>
          <p>Rate lessons</p>
        </div>
        <div className={styles.item}>
          <h5>Volunteers</h5>
          <p>Create and edit profiles</p>
          <p>Manage availability</p>
          <p>Track appointments</p>
        </div>
        <div className={styles.item}>
          <h5>Admins</h5>
          <p>Match students and volunteers</p>
          <p>Customize landing pages</p>
          <p>Vet new volunteers</p>
        </div>
      </div>
    </div>
  );
}
