import { Chip, ChipSet } from '@rmwc/chip';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
} from '@rmwc/data-table';
import { FormEvent, memo, useCallback, useMemo } from 'react';
import { Checkbox } from '@rmwc/checkbox';
import { Switch } from '@rmwc/switch';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import cn from 'classnames';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';

import { Aspect, Callback, Check, SocialInterface, UserJSON } from 'lib/model';
import clone from 'lib/utils/clone';
import { useContinuous } from 'lib/hooks';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

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
  onChange: (updated: UserJSON) => Promise<void>;
  openEdit: () => void;
  openMatch: () => void;
  closeDialog: () => void;
  setLoading: Callback<boolean>;
  setChecked: Callback<boolean>;
}

export default memo(function DisplayPage({
  value,
  onChange,
  openEdit,
  openMatch,
  closeDialog,
  setLoading,
  setChecked: setLoaderChecked,
}: DisplayPageProps): JSX.Element {
  const { t } = useTranslation();
  const { org } = useOrg();
  const {
    user: { id: currentUserId },
  } = useUser();

  const updateRemote = useCallback(
    async (updated: UserJSON) => {
      const url = `/api/users/${updated.id}`;
      await onChange(updated);
      const { data } = await axios.put<UserJSON>(url, updated);
      if (!dequal(data, updated)) await onChange(data);
      return data;
    },
    [onChange]
  );

  const { data: user, setData: setUser } = useContinuous<UserJSON>(
    value,
    updateRemote
  );

  const onVisibilityChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const visible = evt.currentTarget.checked;
      return setUser((prev) => ({ ...prev, visible }));
    },
    [setUser]
  );

  const onFeaturedChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { checked } = evt.currentTarget;
      return setUser((prev) => {
        const featured: Aspect[] = [];
        if (!checked) return { ...prev, featured };
        if (prev.tutoring.subjects.length) featured.push('tutoring');
        if (prev.mentoring.subjects.length) featured.push('mentoring');
        return { ...prev, featured };
      });
    },
    [setUser]
  );

  const openEmail = useCallback(() => {
    const url = encodeURIComponent(`"${user.name}"<${user.email}>`);
    window.open(`mailto:${url}`);
  }, [user.name, user.email]);

  const getChecked = useCallback(
    (c: Check) => {
      return user.verifications.some((v) => v.checks.includes(c));
    },
    [user.verifications]
  );
  const setChecked = useCallback(
    (evt: FormEvent<HTMLInputElement>, c: Check) => {
      const { checked } = evt.currentTarget;
      return setUser((prev) => {
        const verifications = clone(prev.verifications);
        const idx = verifications.findIndex((v) => v.checks.includes(c));
        if (idx < 0 && checked) {
          verifications.push({
            user: currentUserId,
            org: org?.id || 'default',
            checks: [c],
            notes: '',
            created: new Date().toJSON(),
            updated: new Date().toJSON(),
          });
        } else if (idx >= 0 && !checked) {
          verifications.splice(idx, 1);
        }
        return { ...prev, verifications };
      });
    },
    [currentUserId, org?.id, setUser]
  );

  const someChecked = useMemo(() => {
    return user.verifications.length > 0;
  }, [user.verifications]);
  const allChecked = useMemo(() => {
    return checks.every((c) => {
      return user.verifications.some((v) => v.checks.includes(c));
    });
  }, [user.verifications]);

  const toggleAll = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { checked } = evt.currentTarget;
      return setUser((prev) => {
        if (!checked) return { ...prev, verifications: [] };
        const verifications = clone(prev.verifications);
        const isChecked = verifications.reduce(
          (a, c) => a.concat(c.checks),
          [] as Check[]
        );
        const notChecked = checks.filter((c) => !isChecked.includes(c));
        notChecked.forEach((check) =>
          verifications.push({
            user: currentUserId,
            org: org?.id || 'default',
            checks: [check],
            notes: '',
            created: new Date().toJSON(),
            updated: new Date().toJSON(),
          })
        );
        return { ...prev, verifications };
      });
    },
    [currentUserId, org?.id, setUser]
  );

  const getValue = useCallback(
    (c: Check) => {
      const idx = user.verifications.findIndex((v) => v.checks.includes(c));
      if (idx < 0) return '';
      return user.verifications[idx].notes;
    },
    [user.verifications]
  );
  const setValue = useCallback(
    (evt: FormEvent<HTMLInputElement>, c: Check) => {
      const { value: notes } = evt.currentTarget;
      return setUser((prev) => {
        const verifications = clone(prev.verifications);
        const idx = verifications.findIndex((v) => v.checks.includes(c));
        if (idx < 0) {
          verifications.push({
            notes,
            user: currentUserId,
            org: org?.id || 'default',
            checks: [c],
            created: new Date().toJSON(),
            updated: new Date().toJSON(),
          });
        } else {
          verifications[idx].notes = notes;
          verifications[idx].updated = new Date().toJSON();
        }
        return { ...prev, verifications };
      });
    },
    [currentUserId, org?.id, setUser]
  );

  const deleteUser = useCallback(async () => {
    setLoading(true);
    await axios.delete(`/api/users/${value.id}`);
    setLoaderChecked(true);
    setTimeout(() => closeDialog(), 1000);
  }, [setLoading, setLoaderChecked, closeDialog, value.id]);

  return (
    <>
      <div className={styles.content}>
        <div className={styles.left}>
          <a
            className={styles.img}
            href={user.photo}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar size={260} src={user.photo} />
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
                      checked={allChecked}
                      indeterminate={someChecked && !allChecked}
                      onChange={toggleAll}
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
                        onChange={(event: FormEvent<HTMLInputElement>) =>
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
                        onChange={(event: FormEvent<HTMLInputElement>) =>
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
          <Switch
            className={styles.switch}
            label={t('user:visible')}
            checked={user.visible}
            onChange={onVisibilityChange}
          />
          <Switch
            className={styles.switch}
            label={t('user:featured')}
            checked={!!user.featured.length}
            onChange={onFeaturedChange}
            disabled={
              !user.tutoring.subjects.length && !user.mentoring.subjects.length
            }
          />
        </div>
      </div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='group_add' label='Create match' onClick={openMatch} />
          <Chip icon='email' label='Send email' onClick={openEmail} />
          <Chip icon='edit' label='Edit user' onClick={openEdit} />
          <Chip icon='delete' label='Delete user' onClick={deleteUser} />
        </ChipSet>
      </div>
    </>
  );
});
