import React from 'react';
import FilterForm from 'components/filter-form';

import { Callback, UsersQuery } from 'lib/model';

import styles from './form.module.scss';

export default function Form({
  query,
  onChange,
}: {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
}): JSX.Element {
  const [elevated, setElevated] = React.useState<boolean>(false);
  const formRef: React.RefObject<HTMLDivElement> = React.createRef();

  React.useEffect(() => {
    const listener = () => {
      if (!formRef.current) return;
      const viewportOffset = formRef.current.getBoundingClientRect();
      const updated: boolean = viewportOffset.top <= 76;
      // We have to wait a tick before changing the class for the animation to
      // work. @see {@link https://stackoverflow.com/a/37643388/10023158}
      if (updated !== elevated) setTimeout(() => setElevated(updated), 100);
    };
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  });

  return (
    <div
      className={styles.form + (elevated ? ` ${styles.elevated}` : '')}
      ref={formRef}
    >
      <FilterForm query={query} onChange={onChange} />
    </div>
  );
}
