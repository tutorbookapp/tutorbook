import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import Intercom from 'lib/intercom';

import styles from './contact-cta.module.scss';

export interface ContactCTAProps {
  header: string;
  body: string;
}

export default function ContactCTA({
  header,
  body,
}: ContactCTAProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(styles.cta, 'dark')}>
      <div className={styles.wrapper}>
        <div className={styles.prompt}>
          <h3>{header}</h3>
          <p>{body}</p>
        </div>
        <Button
          onClick={() => Intercom('showNewMessage', t('common:new-org-msg'))}
          label='Contact Us'
          raised
          arrow
        />
      </div>
    </div>
  );
}
