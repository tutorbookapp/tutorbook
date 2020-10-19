import useTranslation from 'next-translate/useTranslation';

import SpotlightMsg from 'components/spotlight-msg';

import { useUser } from 'lib/context/user';

import OrgVetsVolunteer from './gifs/org-vets-volunteer.gif';
import StudentRequests from './gifs/student-requests.gif';
import VolunteerEmails from './gifs/volunteer-emails.gif';
import VolunteerRegisters from './gifs/volunteer-registers.gif';
import styles from './about.module.scss';

export default function About(): JSX.Element {
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
          img={VolunteerRegisters}
          cta={{
            label: t('about:step-one-cta'),
            href: '/[org]/signup',
            as: `/${user.orgs[0] || 'default'}/signup`,
          }}
          flipped
        />
        <SpotlightMsg
          label={t('about:step-two-label')}
          headline={t('about:step-two-title')}
          body={t('about:step-two-body')}
          img={OrgVetsVolunteer}
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
          img={StudentRequests}
          cta={{
            label: t('about:step-three-cta'),
            href: '/[org]/search/[[...slug]]',
            as: `/${user.orgs[0] || 'default'}/search`,
          }}
          flipped
        />
        <SpotlightMsg
          label={t('about:step-four-label')}
          headline={t('about:step-four-title')}
          body={t('about:step-four-body')}
          img={VolunteerEmails}
          cta={{
            label: t('about:learn-more'),
            href: 'https://github.com/tutorbookapp/tutorbook/issues/82',
          }}
          gray
        />
      </div>
    </>
  );
}
