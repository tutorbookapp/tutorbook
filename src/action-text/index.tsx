import React from 'react';

import Checkmark from '@tutorbook/loader/checkmark';

import styles from './action-text.module.scss';

interface ActionTextProps {
  body?: string;
  loading?: boolean;
  headline: string;
}

/**
 * This action text React component represents the main view when a user clicks
 * on an email CTA button. For example, we'll statically pre-render a loading
 * icon (e.g. "Verifying email...") and then as soon as it becomes hydrated on
 * the client side, we'll call our API endpoint, verify the email, and show a
 * success message.
 *
 * Right now, this is only being used in the `src/pages/[locale]/approve.tsx`
 * page (that is shown to parents when they approve a tutoring match).
 */
export default function ActionText(props: ActionTextProps): JSX.Element {
  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <main className={styles.text}>
          <h2 className={styles.headline}>
            {props.headline}
            {props.loading && (
              <span className={styles.spinner}>
                <Checkmark black />
              </span>
            )}
          </h2>
          {props.body && <p className={styles.body}>{props.body}</p>}
        </main>
      </div>
    </div>
  );
}
