import React from 'react';

import styles from './toggle.module.scss';

function Checkmark(): JSX.Element {
  return (
    <svg
      className={styles.checkmark}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 38 28'
    >
      <path
        d='M3 15l10 10L35 3'
        fill='none'
        stroke-linecap='round'
        stroke-linejoin='round'
        stroke-width='6'
      ></path>
    </svg>
  );
}

interface ToggleProps {
  readonly options: [string, string];
  readonly onChange: (index: 0 | 1) => void;
}

export default function Toggle(props: ToggleProps): JSX.Element {
  const [selected, setSelected] = React.useState<0 | 1>(0);
  return (
    <div className={styles.wrapper}>
      <div className={styles.toggle}>
        <ul className={styles.options}>
          {props.options.map((option: string, index: number) => (
            <li
              onClick={() => {
                props.onChange(index as 0 | 1);
                setSelected(index as 0 | 1);
              }}
              className={styles.optionsText}
              key={index}
            >
              {option}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={styles.selected + (selected === 1 ? ' ' + styles.moved : '')}
      >
        {props.options.map((option: string, index: number) => (
          <span
            className={
              styles.selectedText +
              (selected === index ? ' ' + styles.activeText : '')
            }
            key={index}
          >
            {option} <Checkmark />
          </span>
        ))}
      </div>
    </div>
  );
}
