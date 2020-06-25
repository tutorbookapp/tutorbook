import { Icon } from '@rmwc/icon';
import { useRouter } from 'next/router';
import { useUser } from '@tutorbook/account';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { Org, OrgJSON } from '@tutorbook/model';
import { IntercomAPI } from '@tutorbook/react-intercom';

import React from 'react';

import useSWR from 'swr';

import { PopOverButton, PopOverAccountLink } from './pop-over';

import styles from './switcher.module.scss';

export default function Switcher(): JSX.Element {
  const [open, setOpen] = React.useState<boolean>(false);
  const { data: orgs } = useSWR<OrgJSON[]>('/api/orgs');
  const { pathname } = useRouter();
  const { user } = useUser();

  return (
    <MenuSurfaceAnchor>
      <MenuSurface
        className={styles.menu}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className={styles.picker}>
          <div className={styles.header}>Personal Account</div>
          <PopOverAccountLink account={user} href='/dashboard' />
          {orgs && !!orgs.length && (
            <>
              <div className={styles.line} />
              <div className={styles.header}>Organizations</div>
              {orgs.map((org: OrgJSON) => (
                <PopOverAccountLink
                  key={org.id}
                  account={Org.fromJSON(org)}
                  href={
                    pathname.indexOf('people') >= 0
                      ? '/dashboard/[org]/people'
                      : '/dashboard/[org]'
                  }
                  as={
                    pathname.indexOf('people') >= 0
                      ? `/dashboard/${org.id}/people`
                      : `/dashboard/${org.id}`
                  }
                />
              ))}
            </>
          )}
          <div className={styles.line} />
          <PopOverButton
            icon='add'
            onClick={() =>
              IntercomAPI(
                'showNewMessage',
                "I'd like to create a new organization."
              )
            }
          >
            Create an Organization
          </PopOverButton>
        </div>
      </MenuSurface>

      <div className={styles.selector}>
        <button
          type='button'
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup
          className={styles.button}
        >
          <div className={styles.wrapper}>
            <div className={styles.selected}>
              <Icon className={styles.selectedIcon} icon='group' />
              <span className={styles.selectedText}>Account</span>
            </div>
            <div className={styles.arrowWrapper}>
              <div className={styles.arrow} />
            </div>
          </div>
        </button>
      </div>
    </MenuSurfaceAnchor>
  );
}
