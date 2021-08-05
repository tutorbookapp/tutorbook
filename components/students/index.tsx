import useTranslation from 'next-translate/useTranslation';

import SpotlightMsg from 'components/spotlight-msg';

import { useUser } from 'lib/context/user';

import styles from './students.module.scss';

export default function Students(): JSX.Element {
  const { t } = useTranslation();
  const { user } = useUser();
  return (
    <>
      <div className={styles.summary}>
        <div className={styles.wrapper}>
          <h2 className={styles.subheader}>{t('about:what-title')}</h2>
          <p className={styles.body}>
            <b className={styles.bold}>{t('about:what-first')}</b>
          </p>
          <p className={styles.body}>{t('about:what-second')}</p>
          <p className={styles.body}>{t('about:what-third')}</p>
        </div>
      </div>
      <div className={styles.howItWorks}>
        <SpotlightMsg
          label={t('about:step-one-label')}
          headline={t('about:step-one-title')}
          body={t('about:step-one-body')}
          img='/gifs/volunteer-registers.gif'
          cta={{
            label: t('about:step-one-cta'),
            href: `/${user.orgs[0] || 'default'}/signup`,
          }}
          flipped
        />
        <SpotlightMsg
          label={t('about:step-two-label')}
          headline={t('about:step-two-title')}
          body={t('about:step-two-body')}
          img='/gifs/org-vets-volunteer.gif'
          cta={{
            label: t('about:learn-more'),
            href: 'https://github.com/tutorbookapp/tutorbook/issues/75',
          }}
          gray
        />
        <SpotlightMsg
          label={t('about:step-three-label')}
          headline={t('about:step-three-title')}
          body={t('about:step-three-body')}
          img='/gifs/student-requests.gif'
          cta={{
            label: t('about:step-three-cta'),
            href: `/${user.orgs[0] || 'default'}/search`,
          }}
          flipped
        />
      </div>
    </>
  );
}
