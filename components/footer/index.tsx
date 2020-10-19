import useTranslation from 'next-translate/useTranslation';
import cn from 'classnames';

import Link from 'lib/intl/link';
import { useUser } from 'lib/context/user';

import styles from './footer.module.scss';

/* import NextLink from 'next/link'; */
/* import config from 'intl/config.json'; */

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

interface LinkProps {
  as?: string;
  href: string;
  label: string;
}

function NavLink({
  as,
  href,
  label,
  className,
}: LinkProps & { className: string }): JSX.Element {
  /* eslint-disable jsx-a11y/anchor-is-valid */
  if (href.indexOf('http') < 0 && href.indexOf('mailto') < 0)
    return (
      <Link href={href} as={as}>
        <a className={className}>{label}</a>
      </Link>
    );
  /* eslint-enable jsx-a11y/anchor-is-valid */
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
  const { t } = useTranslation();
  const { user } = useUser();
  return (
    <footer className={cn(styles.wrapper, { [styles.formWidth]: formWidth })}>
      <span className={styles.sitemapTitle}>
        <h1 id='sitemap'>{t('common:footer-sitemap')}</h1>
      </span>
      <nav className={styles.contentWrapper} aria-labelledby='sitemap'>
        <ul className={styles.primaryLinks}>
          <LinkGroup
            header={t('common:footer-useful-links')}
            links={[
              {
                href: '/[org]/signup',
                as: `/${user.orgs[0] || 'default'}/signup`,
                label: t('common:footer-signup'),
              },
              {
                href: '/[org]/search/[[...slug]]',
                as: `/${user.orgs[0] || 'default'}/search`,
                label: t('common:footer-search'),
              },
              {
                href:
                  'https://github.com/tutorbookapp/tutorbook/issues/new/choose',
                label: t('common:footer-issue'),
              },
            ]}
          />
          <LinkGroup
            header={t('common:footer-resources')}
            links={[
              {
                href: 'https://intercom.help/tutorbook',
                label: t('common:footer-help-center'),
              },
              {
                href:
                  'https://intercom.help/tutorbook/articles/4048870-how-it-works',
                label: t('common:footer-how-it-works'),
              },
              {
                href: 'https://github.com/orgs/tutorbookapp',
                label: t('common:footer-open-source'),
              },
              {
                href: 'https://github.com/tutorbookapp/tutorbook#readme',
                label: t('common:footer-docs'),
              },
            ]}
          />
          <LinkGroup
            header={t('common:footer-partners')}
            links={[
              {
                href: 'https://projectaccess.org/',
                label: t('common:project-access'),
              },
              {
                href: 'https://schoolclosures.org/',
                label: t('common:school-closures'),
              },
              {
                href: 'http://learnpanion.com/',
                label: t('common:learnpanion'),
              },
              {
                href: 'https://studyroom.at/',
                label: t('common:studyroom'),
              },
              {
                href: 'https://interns4good.org/',
                label: t('common:interns4good'),
              },
            ]}
          />
          <LinkGroup
            header={t('common:footer-socials')}
            links={[
              {
                href: 'https://facebook.com/tutorbookapp',
                label: t('common:facebook'),
              },
              {
                href: 'https://instagram.com/tutorbookapp',
                label: t('common:instagram'),
              },
              {
                href: 'https://twitter.com/tutorbookapp',
                label: t('common:twitter'),
              },
              {
                href: 'https://github.com/orgs/tutorbookapp',
                label: t('common:github'),
              },
              {
                href: 'https://helpwithcovid.com/projects/782-tutorbook',
                label: t('common:helpwithcovid'),
              },
              {
                href: 'https://www.indiehackers.com/product/tutorbook',
                label: t('common:indiehackers'),
              },
            ]}
          />
          <LinkGroup
            header={t('common:footer-team')}
            links={[
              {
                href: 'https://tutorbook.atlassian.net/wiki/spaces/TB/overview',
                label: t('common:footer-team-home'),
              },
              {
                href: 'https://tutorbook.atlassian.net/people',
                label: t('common:footer-team-directory'),
              },
              {
                href:
                  'https://join.slack.com/t/tutorbookapp/shared_invite/zt-ekmpvd9t-uzH_HuS6KbwVg480TAMa5g',
                label: t('common:footer-team-slack'),
              },
              {
                href: 'https://helpwithcovid.com/projects/782-tutorbook',
                label: t('common:footer-team-join'),
              },
              {
                href: 'mailto:team@tutorbook.org',
                label: t('common:footer-contact'),
              },
            ]}
          />
        </ul>
      </nav>
    </footer>
  );
}

Footer.defaultProps = { formWidth: false };
