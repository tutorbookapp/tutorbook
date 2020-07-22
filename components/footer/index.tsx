import React from 'react';
/* import NextLink from 'next/link'; */
/* import config from 'intl/config.json'; */
import { defineMessages } from 'react-intl';
import { useMsg, IntlHelper, Link, Msg } from 'lib/intl';
import { SocialTypeAlias } from 'lib/model';

import styles from './footer.module.scss';

const socials: Record<SocialTypeAlias, Msg> = defineMessages({
  facebook: {
    id: 'socials.facebook',
    defaultMessage: 'Facebook',
  },
  instagram: {
    id: 'socials.instagram',
    defaultMessage: 'Instagram',
  },
  twitter: {
    id: 'socials.twitter',
    defaultMessage: 'Twitter',
  },
  linkedin: {
    id: 'socials.linkedin',
    defaultMessage: 'LinkedIn',
  },
  github: {
    id: 'socials.github',
    defaultMessage: 'GitHub',
  },
  website: {
    id: 'socials.website',
    defaultMessage: 'Website',
  },
  indiehackers: {
    id: 'socials.indiehackers',
    defaultMessage: 'IndieHackers',
  },
});

/*
 *const locales: Record<string, Msg> = defineMessages({
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
 *      {msg(labels.lang)}
 *    </h3>
 *    <ul className={styles.langLinksList}>
 *      {config.locales.map((locale: string, index: number) => (
 *        <LangLink
 *          key={index}
 *          href={`/${locale}`}
 *          label={msg(locales[locale])}
 *        />
 *      ))}
 *    </ul>
 *  </nav>
 *</ul>
 */

const labels: Record<string, Msg> = defineMessages({
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
  const msg: IntlHelper = useMsg();
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
            header={msg(labels.usefulLinks)}
            links={[
              {
                href: '/signup',
                label: msg(labels.signup),
              },
              {
                href: '/search',
                label: msg(labels.search),
              },
              {
                href:
                  'https://github.com/tutorbookapp/tutorbook/issues/new/choose',
                label: msg(labels.issue),
              },
            ]}
          />
          <LinkGroup
            header={msg(labels.resources)}
            links={[
              {
                href: 'https://intercom.help/tutorbook',
                label: msg(labels.help),
              },
              {
                href:
                  'https://intercom.help/tutorbook/articles/4048870-how-it-works',
                label: msg(labels.howItWorks),
              },
              {
                href: 'https://github.com/orgs/tutorbookapp',
                label: msg(labels.openSource),
              },
              {
                href: 'https://github.com/tutorbookapp/tutorbook#readme',
                label: msg(labels.docs),
              },
            ]}
          />
          <LinkGroup
            header={msg(labels.partners)}
            links={[
              {
                href: 'https://projectaccess.org/',
                label: msg(labels.projectAccess),
              },
              {
                href: 'https://schoolclosures.org/',
                label: msg(labels.schoolClosures),
              },
              {
                href: 'http://learnpanion.com/',
                label: msg(labels.learnpanion),
              },
              {
                href: 'https://studyroom.at/',
                label: msg(labels.studyRoom),
              },
              {
                href: 'https://interns4good.org/',
                label: msg(labels.interns4Good),
              },
            ]}
          />
          <LinkGroup
            header={msg(labels.socials)}
            links={[
              {
                href: 'https://facebook.com/tutorbookapp',
                label: msg(socials.facebook),
              },
              {
                href: 'https://instagram.com/tutorbookapp',
                label: msg(socials.instagram),
              },
              {
                href: 'https://twitter.com/tutorbookapp',
                label: msg(socials.twitter),
              },
              {
                href: 'https://github.com/orgs/tutorbookapp',
                label: msg(socials.github),
              },
              {
                href: 'https://helpwithcovid.com/projects/782-tutorbook',
                label: msg(labels.helpWithCOVID),
              },
              {
                href: 'https://www.indiehackers.com/product/tutorbook',
                label: msg(labels.indieHackers),
              },
            ]}
          />
          <LinkGroup
            header={msg(labels.team)}
            links={[
              {
                href: 'https://tutorbook.atlassian.net/wiki/spaces/TB/overview',
                label: msg(labels.home),
              },
              {
                href: 'https://tutorbook.atlassian.net/people',
                label: msg(labels.directory),
              },
              {
                href:
                  'https://join.slack.com/t/tutorbookapp/shared_invite/zt-ekmpvd9t-uzH_HuS6KbwVg480TAMa5g',
                label: msg(labels.slack),
              },
              {
                href: 'https://helpwithcovid.com/projects/782-tutorbook',
                label: msg(labels.join),
              },
              {
                href: 'mailto:team@tutorbook.org',
                label: msg(labels.contact),
              },
            ]}
          />
        </ul>
      </nav>
    </footer>
  );
}
