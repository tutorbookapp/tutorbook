import styles from './checkmark.module.scss';

interface Props {
  readonly [propName: string]: any;
  readonly black?: boolean;
  readonly checked?: boolean;
}

export default function Checkmark(props: Props) {
  return (
    <svg
      {...props}
      className={
        styles.checkmark +
        (props.className ? ` ${props.className}` : '') +
        (props.checked && props.black
          ? ` ${styles.checkmarkCheckedBlack}`
          : props.checked
          ? ` ${styles.checkmarkChecked}`
          : '') +
        (props.black ? ` ${styles.checkmarkBlack}` : '')
      }
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 52 52'
    >
      <circle
        className={
          styles.checkmarkCircle +
          (props.black ? ` ${styles.checkmarkCircleBlack}` : '')
        }
        cx='26'
        cy='26'
        r='25'
        fill='none'
      />
      <path
        className={styles.checkmarkCheck}
        fill='none'
        d='M14.1 27.2l7.1 7.2 16.7-16.8'
      />
    </svg>
  );
}
