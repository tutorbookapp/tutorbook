import React from 'react';
/* import NextLink from 'next/link'; */
import { socials } from '@tutorbook/intl/msgs';
import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
} from 'react-intl';
/* import config from '@tutorbook/intl/config.json'; */
import { Link } from '@tutorbook/intl';

import styles from './footer.module.scss';

/*
 *const locales: Record<string, MessageDescriptor> = defineMessages({
 *  en: {
 *    id: 'footer.lang.english',
 *    defaultMessage: 'English',
 *    description: 'Label for the "English" language option.',
 *  },
 *  fr: {
 *    id: 'footer.lang.french',
 *    defaultMessage: 'French',
 *    description: 'Label for the "French" language option.',
 *  },
 *  se: {
 *    id: 'footer.lang.spanish',
 *    defaultMessage: 'Spanish',
 *    description: 'Label for the "Spanish" language option.',
 *  },
 *  tr: {
 *    id: 'footer.lang.turkish',
 *    defaultMessage: 'Turkish',
 *    description: 'Label for the "Turkish" language option.',
 *  },
 *});
 */
/*
 *<ul className={styles.langLinks}>
 *  <nav aria-labelledby='locale-picker-title'>
 *    <h3 id='locale-picker-title' className={styles.langTitle}>
 *      <span
 *        className={styles.langTitleIcon}
 *        role='img'
 *        aria-hidden='true'
 *      >
 *        🌎{' '}
 *      </span>
 *      {intl.formatMessage(labels.lang)}
 *    </h3>
 *    <ul className={styles.langLinksList}>
 *      {config.locales.map((locale: string, index: number) => (
 *        <LangLink
 *          key={index}
 *          href={`/${locale}`}
 *          label={intl.formatMessage(locales[locale])}
 *        />
 *      ))}
 *    </ul>
 *  </nav>
 *</ul>
 */

const labels: Record<string, MessageDescriptor> = defineMessages({
  lang: {
    id: 'footer.lang.choose',
    defaultMessage: 'Choose your language',
    description: 'Header prompting the user to choose their language`',
  },
  team: {
    id: 'footer.team.title',
    defaultMessage: 'Team',
  },
  home: {
    id: 'footer.team.home',
    defaultMessage: 'Home',
    description: 'Label for the team homepage link.',
  },
  directory: {
    id: 'footer.team.directory',
    defaultMessage: 'Directory',
    description: 'Label for the team directory link.',
  },
  slack: {
    id: 'footer.team.slack',
    defaultMessage: 'Join the Slack',
    description: 'Label for the team Slack workspace link.',
  },
  join: {
    id: 'footer.team.join',
    defaultMessage: 'Join the Team',
    description: 'Label for the "Join Our Team" link.',
  },
  contact: {
    id: 'footer.team.contact',
    defaultMessage: 'Contact Us',
  },
  socials: {
    id: 'footer.socials.title',
    defaultMessage: 'Socials',
  },
  helpWithCOVID: {
    id: 'footer.socials.help-with-covid',
    defaultMessage: 'HelpWithCOVID',
  },
  indieHackers: {
    id: 'footer.socials.indie-hackers',
    defaultMessage: 'IndieHackers',
  },
  resources: {
    id: 'footer.resources.title',
    defaultMessage: 'Resources',
  },
  help: {
    id: 'footer.resources.help-center',
    defaultMessage: 'Help Center',
  },
  howItWorks: {
    id: 'footer.resources.how-it-works',
    defaultMessage: 'How It Works',
  },
  openSource: {
    id: 'footer.resources.open-source',
    defaultMessage: 'Open Source',
  },
  docs: {
    id: 'footer.resources.developer-docs',
    defaultMessage: 'Developer Docs',
  },
  usefulLinks: {
    id: 'footer.useful-links.title',
    defaultMessage: 'Useful Links',
  },
  signup: {
    id: 'footer.useful-links.signup',
    defaultMessage: 'Volunteer Signup',
    description: 'Label for the link to the tutor sign-up page.',
  },
  search: {
    id: 'footer.useful-links.search',
    defaultMessage: 'Search Volunteers',
    description: 'Label for the link to the search view.',
  },
  issue: {
    id: 'footer.useful-links.report-issue',
    defaultMessage: 'Report an Issue',
    description: 'Label for the link to create a new GitHub issue.',
  },
  partners: {
    id: 'footer.partners.title',
    defaultMessage: 'Partners',
  },
  schoolClosures: {
    id: 'footer.partners.school-closures',
    defaultMessage: 'School Closures',
  },
  projectAccess: {
    id: 'footer.partners.project-access',
    defaultMessage: 'Project Access',
  },
  learnpanion: {
    id: 'footer.partners.learnpanion',
    defaultMessage: 'Learnpanion',
  },
  studyRoom: {
    id: 'footer.partners.study-room',
    defaultMessage: 'StudyRoom',
  },
  interns4Good: {
    id: 'footer.partners.interns4good',
    defaultMessage: 'Interns4Good',
  },
});

interface LinkProps {
  href: string;
  label: string;
}

function NavLink({
  href,
  label,
  className,
}: LinkProps & { className: string }): JSX.Element {
  if (href.indexOf('http') < 0 && href.indexOf('mailto') < 0)
    return (
      /* eslint-disable jsx-a11y/anchor-is-valid */
      <Link href={href}>
        <a className={className}>{label}</a>
      </Link>
      /* eslint-enable jsx-a11y/anchor-is-valid */
    );
  return (
    <a className={className} href={href}>
      {label}
    </a>
  );
}

function PrimaryLink(props: LinkProps): JSX.Element {
  return (
    <li className={styles.primaryLinkItem}>
      <NavLink {...props} className={styles.primaryLink} />
    </li>
  );
}

/*
 *function LangLink(props: LinkProps): JSX.Element {
 *  return (
 *    <li className={styles.langLinkItem}>
 *      <NextLink href={props.href}>
 *        <a className={styles.langLink}>{props.label}</a>
 *      </NextLink>
 *    </li>
 *  );
 *}
 */

interface LinkGroupProps {
  header: string;
  links: LinkProps[];
}

function LinkGroup({ header, links }: LinkGroupProps): JSX.Element {
  return (
    <li className={styles.linkGroup}>
      <h2 className={styles.linkGroupHeader}>{header}</h2>
      <ul className={styles.linkGroupList}>
        {links.map((link) => (
          <PrimaryLink key={link.href} {...link} />
        ))}
      </ul>
    </li>
  );
}

export default function Footer({
  formWidth,
}: {
  formWidth?: boolean;
}): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <footer
      className={styles.footer + (formWidth ? ` ${styles.formWidth}` : '')}
    >
      <span className={styles.sitemapTitle}>
        <h1 id='sitemap'>Sitemap</h1>
      </span>
      <nav className={styles.contentWrapper} aria-labelledby='sitemap'>
        <ul className={styles.primaryLinks}>
          <LinkGroup
            header={intl.formatMessage(labels.usefulLinks)}
            links={[
              {
                href: '/signup',
                label: intl.formatMessage(labels.signup),
              },
              {
                href: '/search',
                label: intl.formatMessage(labels.search),
              },
              {
                href:
                  'https://github.com/tutorbookapp/tutorbook/issues/new/choose',
                label: intl.formatMessage(labels.issue),
              },
            ]}
          />
          <LinkGroup
            header={intl.formatMessage(labels.resources)}
            links={[
              {
                href: 'https://intercom.help/tutorbook',
                label: intl.formatMessage(labels.help),
              },
              {
                href:
                  'https://intercom.help/tutorbook/articles/4048870-how-it-works',
                label: intl.formatMessage(labels.howItWorks),
              },
              {
                href: 'https://github.com/orgs/tutorbookapp',
                label: intl.formatMessage(labels.openSource),
              },
              {
                href: 'https://github.com/tutorbookapp/tutorbook#readme',
                label: intl.formatMessage(labels.docs),
              },
            ]}
          />
          <LinkGroup
            header={intl.formatMessage(labels.partners)}
            links={[
              {
                href: 'https://projectaccess.org/',
                label: intl.formatMessage(labels.projectAccess),
              },
              {
                href: 'https://schoolclosures.org/',
                label: intl.formatMessage(labels.schoolClosures),
              },
              {
                href: 'http://learnpanion.com/',
                label: intl.formatMessage(labels.learnpanion),
              },
              {
                href: 'https://studyroom.at/',
                label: intl.formatMessage(labels.studyRoom),
              },
              {
                href: 'https://interns4good.org/',
                label: intl.formatMessage(labels.interns4Good),
              },
            ]}
          />
          <LinkGroup
            header={intl.formatMessage(labels.socials)}
            links={[
              {
                href: 'https://facebook.com/tutorbookapp',
                label: intl.formatMessage(socials.facebook),
              },
              {
                href: 'https://instagram.com/tutorbookapp',
                label: intl.formatMessage(socials.instagram),
              },
              {
                href: 'https://twitter.com/tutorbookapp',
                label: intl.formatMessage(socials.twitter),
              },
              {
                href: 'https://github.com/orgs/tutorbookapp',
                label: intl.formatMessage(socials.github),
              },
              {
                href: 'https://helpwithcovid.com/projects/782-tutorbook',
                label: intl.formatMessage(labels.helpWithCOVID),
              },
              {
                href: 'https://www.indiehackers.com/product/tutorbook',
                label: intl.formatMessage(labels.indieHackers),
              },
            ]}
          />
          <LinkGroup
            header={intl.formatMessage(labels.team)}
            links={[
              {
                href: 'https://tutorbook.atlassian.net/wiki/spaces/TB/overview',
                label: intl.formatMessage(labels.home),
              },
              {
                href: 'https://tutorbook.atlassian.net/people',
                label: intl.formatMessage(labels.directory),
              },
              {
                href:
                  'https://join.slack.com/t/tutorbookapp/shared_invite/zt-ekmpvd9t-uzH_HuS6KbwVg480TAMa5g',
                label: intl.formatMessage(labels.slack),
              },
              {
                href: 'https://helpwithcovid.com/projects/782-tutorbook',
                label: intl.formatMessage(labels.join),
              },
              {
                href: 'mailto:team@tutorbook.org',
                label: intl.formatMessage(labels.contact),
              },
            ]}
          />
        </ul>
      </nav>
    </footer>
  );
}
