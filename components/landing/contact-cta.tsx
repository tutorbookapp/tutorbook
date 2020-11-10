import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import { IntercomAPI } from 'components/intercom';

import styles from './contact-cta.module.scss';

export default function ContactCTA(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(styles.cta, 'dark')}>
      <div className={styles.wrapper}>
        <div className={styles.prompt}>
          <h3>{t('landing:contact-header')}</h3>
          <p>{t('landing:contact-body')}</p>
        </div>
        <Button
          onClick={() => IntercomAPI('showNewMessage', t('common:new-org-msg'))}
          label='Contact Us'
          raised
          arrow
        />
      </div>
    </div>
  );
}
