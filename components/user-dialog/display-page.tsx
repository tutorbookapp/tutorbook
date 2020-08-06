import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import Avatar from 'components/avatar';
import { IconButton } from '@rmwc/icon-button';
import { Chip, ChipSet } from '@rmwc/chip';
import {
  UserJSON,
  Verification,
  Check,
  Callback,
  SocialInterface,
} from 'lib/model';
import { useUser } from 'lib/account';
import { Checkbox } from '@rmwc/checkbox';
import {
  DataTable,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@rmwc/data-table';
import { TextField } from '@rmwc/textfield';

import axios from 'axios';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import styles from './display-page.module.scss';

const checks: Check[] = [
  'background-check',
  'email',
  'academic-email',
  'training',
  'interview',
];

export interface DisplayPageProps {
  value: UserJSON;
  onChange: Callback<UserJSON>;
  openEdit: () => Promise<void>;
  openRequest: () => Promise<void>;
  openMatch: () => Promise<void>;
  onClosed: () => void;
}

export default memo(function DisplayPage({
  value,
  onChange: onFinalChange,
  openEdit,
  openRequest,
  openMatch,
  onClosed,
}: DisplayPageProps): JSX.Element {
  const { t } = useTranslation();
  const { user: currentUser } = useUser();
  const [user, setUser] = useState<UserJSON>(value);

  useEffect(() => setUser(value), [value]);

  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  const onChange = useCallback(
    (updated: UserJSON) => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = undefined;
      }
      setUser(updated);
      const updateRemote = async () => {
        const url = `/api/users/${updated.id}`;
        const { data: remoteUpdated } = await axios.put<UserJSON>(url, updated);
        onFinalChange(remoteUpdated);
      };
      timeoutId.current = setTimeout(() => {
        void updateRemote();
      }, 5000);
    },
    [onFinalChange]
  );

  const email = useCallback(() => {
    const url = encodeURIComponent(`"${user.name}"<${user.email}>`);
    window.open(`mailto:${url}`);
  }, [user.name, user.email]);

  // Deep copy the array of `Verification` objects.
  // @see {@link https://stackoverflow.com/a/40283265/10023158}
  const clone = (vs: Verification[]) => vs.map((v: Verification) => ({ ...v }));
  const getIndex = (check: Check) =>
    user.verifications.findIndex((v) => v.checks.indexOf(check) >= 0);

  const getChecked = (check: Check) => getIndex(check) >= 0;
  const setChecked = (
    event: React.FormEvent<HTMLInputElement>,
    check: Check
  ) => {
    const updated: Verification[] = clone(user.verifications);
    if (getIndex(check) >= 0 && !event.currentTarget.checked) {
      updated.splice(getIndex(check), 1);
    } else {
      updated.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      });
    }
    return onChange({ ...user, verifications: updated });
  };

  const getSomeChecked = () =>
    user.verifications.length > 0 && user.verifications.length < checks.length;
  const getAllChecked = () => checks.every((c) => getChecked(c));
  const setAllChecked = (event: React.FormEvent<HTMLInputElement>) => {
    if (!event.currentTarget.checked)
      return onChange({ ...user, verifications: [] });
    const updated: Verification[] = clone(user.verifications);
    const checked: Check[] = Object.values(user.verifications).reduce(
      (acc, cur) => {
        return acc.concat(cur.checks);
      },
      [] as Check[]
    );
    const stillNeedsToBeChecked: Check[] = checks.filter(
      (c) => checked.indexOf(c) < 0
    );
    stillNeedsToBeChecked.forEach((check: Check) =>
      updated.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      })
    );
    return onChange({ ...user, verifications: updated });
  };

  const getValue = (check: Check) =>
    (user.verifications[getIndex(check)] || {}).notes || '';
  const setValue = (event: React.FormEvent<HTMLInputElement>, check: Check) => {
    const updated: Verification[] = clone(user.verifications);
    if (getIndex(check) >= 0) {
      updated[getIndex(check)].notes = event.currentTarget.value;
    } else {
      updated.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: event.currentTarget.value,
        created: new Date(),
        updated: new Date(),
      });
    }
    return onChange({ ...user, verifications: updated });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={onClosed} />
      </div>
      <div className={styles.content}>
        <div className={styles.left}>
          <a
            className={styles.img}
            href={user.photo}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar src={user.photo} />
          </a>
          <h4 className={styles.name}>{user.name}</h4>
          {user.socials && !!user.socials.length && (
            <div className={styles.socials}>
              {user.socials.map((social: SocialInterface) => (
                <a
                  key={social.type}
                  target='_blank'
                  rel='noreferrer'
                  href={social.url}
                  className={cn(styles.socialLink, styles[social.type])}
                >
                  {social.type}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className={styles.right}>
          <h6 className={styles.header}>{t('common:about')}</h6>
          <p className={styles.text}>{user.bio}</p>
          <DataTable className={styles.table}>
            <DataTableContent>
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeadCell hasFormControl>
                    <Checkbox
                      checked={getAllChecked()}
                      indeterminate={getSomeChecked()}
                      onChange={setAllChecked}
                    />
                  </DataTableHeadCell>
                  <DataTableHeadCell>
                    {t('user:verification-description')}
                  </DataTableHeadCell>
                  <DataTableHeadCell>
                    {t('user:verification-notes')}
                  </DataTableHeadCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {checks.map((check: Check) => (
                  <DataTableRow key={check}>
                    <DataTableCell hasFormControl>
                      <Checkbox
                        checked={getChecked(check)}
                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                          setChecked(event, check)
                        }
                      />
                    </DataTableCell>
                    <DataTableCell>
                      {t(`user:verification-${check}`)}
                    </DataTableCell>
                    <DataTableCell>
                      <TextField
                        value={getValue(check)}
                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                          setValue(event, check)
                        }
                        className={styles.field}
                      />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTableContent>
          </DataTable>
        </div>
      </div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='edit' label='Edit profile' onClick={openEdit} />
          <Chip icon='send' label='Send request' onClick={openRequest} />
          <Chip icon='email' label='Send email' onClick={email} />
          <Chip icon='people' label='Match student' onClick={openMatch} />
        </ChipSet>
      </div>
    </div>
  );
});
