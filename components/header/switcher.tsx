import { useRouter } from 'next/router';
import { useUser, useOrgs } from 'lib/account';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { Org, OrgJSON } from 'lib/model';
import { IntercomAPI } from 'components/react-intercom';

import React from 'react';

import { PopOverButton, PopOverAccountLink } from './pop-over';

import styles from './switcher.module.scss';

export default function Switcher(): JSX.Element {
  const { pathname, query } = useRouter();
  const { orgs } = useOrgs();
  const { user } = useUser();

  const [open, setOpen] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<string>('Account');

  React.useEffect(() => {
    if (!orgs) return setSelected('Account');
    const idx: number = orgs.findIndex((o: OrgJSON) => o.id === query.org);
    if (idx < 0) return setSelected('Account');
    return setSelected(orgs[idx].name);
  }, [orgs, query]);

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
                      ? '/[org]/dashboard/people'
                      : '/[org]/dashboard'
                  }
                  as={
                    pathname.indexOf('people') >= 0
                      ? `/${org.id}/dashboard/people`
                      : `/${org.id}/dashboard`
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
              <span className={styles.selectedText}>{selected}</span>
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
