import React from 'react';
import QueryForm from '@tutorbook/query-form';

import { Query } from '@tutorbook/model';
import { Card } from '@rmwc/card';

import styles from './form.module.scss';

export default function Form({
  query,
  onChange,
}: {
  query: Query;
  onChange: (query: Query) => any;
}): JSX.Element {
  const [elevated, setElevated] = React.useState<boolean>(false);
  const formRef: React.RefObject<HTMLDivElement> = React.createRef();

  React.useEffect(() => {
    const listener = () => {
      if (!formRef.current) return;
      const viewportOffset = formRef.current.getBoundingClientRect();
      const updated: boolean = viewportOffset.top <= 74;
      // We have to wait a tick before changing the class for the animation to
      // work. @see {@link https://stackoverflow.com/a/37643388/10023158}
      if (updated !== elevated) setTimeout(() => setElevated(updated), 100);
    };
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  });

  return (
    <Card
      className={styles.form + (elevated ? ' ' + styles.elevated : '')}
      ref={formRef}
    >
      <QueryForm query={query} onChange={onChange} />
    </Card>
  );
}
