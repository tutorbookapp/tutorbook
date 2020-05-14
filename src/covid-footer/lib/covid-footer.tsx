import React from 'react';
import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
} from 'react-intl';

import styles from './covid-footer.module.scss';

interface SecondaryLinkProps {
  href: string;
  label: string;
}

function SecondaryLink(props: SecondaryLinkProps) {
  return (
    <li className={styles.secondaryLinkItem}>
      <a href={props.href} className={styles.secondaryLink}>
        {props.label}
      </a>
    </li>
  );
}

export default function Footer() {
  const intl: IntlShape = useIntl();
  const labels: Record<string, MessageDescriptor> = defineMessages({
    terms: {
      id: 'footer.terms',
      defaultMessage: 'Terms',
      description: 'Label for the "Terms & Policies" footer link.',
    },
    privacy: {
      id: 'footer.privacy',
      defaultMessage: 'Privacy',
      description: 'Label for the "Privacy Policy" footer link.',
    },
    security: {
      id: 'footer.security',
      defaultMessage: 'Security',
      description: 'Label for the "Security Policy" footer link.',
    },
  });
  return (
    <footer className={styles.footer}>
      <span className={styles.sitemapTitle}>
        <h1 id='sitemap'>Sitemap</h1>
      </span>
      <nav className={styles.contentWrapper} aria-labelledby='sitemap'>
        <ul className={styles.secondaryLinks}>
          <SecondaryLink
            href='https://tutorbook.app/legal/#terms'
            label={intl.formatMessage(labels.terms)}
          />
          <SecondaryLink
            href='https://tutorbook.app/legal/#privacy'
            label={intl.formatMessage(labels.privacy)}
          />
          <SecondaryLink
            href='https://tutorbook.app/legal/#security'
            label={intl.formatMessage(labels.security)}
          />
        </ul>
      </nav>
    </footer>
  );
}
