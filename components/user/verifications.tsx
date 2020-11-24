import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
} from '@rmwc/data-table';
import { FormEvent, useCallback, useMemo } from 'react';
import { Snackbar, SnackbarAction } from '@rmwc/snackbar';
import { Checkbox } from '@rmwc/checkbox';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';
import { mutate } from 'swr';

import { Check, User, UserJSON, Verification } from 'lib/model';
import clone from 'lib/utils/clone';
import { useContinuous } from 'lib/hooks';
import { useUser } from 'lib/context/user';

import styles from './verifications.module.scss';

const checks: Check[] = [
  'background-check',
  'email',
  'academic-email',
  'training',
  'interview',
];

export interface VerificationsTableProps {
  user: User;
}

export default function VerificationsTable({
  user: initialData,
}: VerificationsTableProps): JSX.Element {
  const { t } = useTranslation();
  const { orgs, user: currentUser } = useUser();

  const updateRemote = useCallback(async (updated: User) => {
    const url = `/api/users/${updated.id}`;
    const { data } = await axios.put<UserJSON>(url, updated.toJSON());
    return User.fromJSON(data);
  }, []);
  const updateLocal = useCallback(async (updated: User) => {
    await mutate(`/api/users/${updated.id}`, updated.toJSON(), false);
  }, []);

  const { data: user, setData: setUser, error, timeout, retry } = useContinuous(
    initialData,
    updateRemote,
    updateLocal
  );

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => user.orgs.includes(o.id));
    if (idx < 0) return 'default';
    return orgs[idx].id;
  }, [orgs, user.orgs]);

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
        const verifications = clone(prev.verifications).map(
          (v) => new Verification(v)
        );
        const idx = verifications.findIndex((v) => v.checks.includes(c));
        if (idx < 0 && checked) {
          verifications.push(
            new Verification({
              org,
              notes: '',
              checks: [c],
              user: currentUser.id,
              created: new Date(),
              updated: new Date(),
            })
          );
        } else if (idx >= 0 && !checked) {
          verifications.splice(idx, 1);
        }
        return new User({ ...prev, verifications });
      });
    },
    [currentUser.id, org, setUser]
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
        if (!checked) return new User({ ...prev, verifications: [] });
        const verifications = clone(prev.verifications).map(
          (v) => new Verification(v)
        );
        const isChecked = verifications.reduce(
          (a, c) => a.concat(c.checks),
          [] as Check[]
        );
        const notChecked = checks.filter((c) => !isChecked.includes(c));
        notChecked.forEach((check) =>
          verifications.push(
            new Verification({
              org,
              notes: '',
              checks: [check],
              user: currentUser.id,
              created: new Date(),
              updated: new Date(),
            })
          )
        );
        return new User({ ...prev, verifications });
      });
    },
    [currentUser.id, org, setUser]
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
        const verifications = clone(prev.verifications).map(
          (v) => new Verification(v)
        );
        const idx = verifications.findIndex((v) => v.checks.includes(c));
        if (idx < 0) {
          verifications.push(
            new Verification({
              org,
              notes,
              checks: [c],
              user: currentUser.id,
              created: new Date(),
              updated: new Date(),
            })
          );
        } else {
          verifications[idx].notes = notes;
          verifications[idx].updated = new Date();
        }
        return new User({ ...prev, verifications });
      });
    },
    [currentUser.id, org, setUser]
  );

  return (
    <>
      {error && (
        <Snackbar
          message={t('user:error', { count: timeout / 1000 })}
          timeout={-1}
          action={<SnackbarAction label={t('common:retry')} onClick={retry} />}
          leading
          open
        />
      )}
      <DataTable className={styles.table}>
        <DataTableContent>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell className={styles.checkbox} hasFormControl>
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={toggleAll}
                />
              </DataTableHeadCell>
              <DataTableHeadCell className={styles.check}>
                {t('user:verification-description')}
              </DataTableHeadCell>
              <DataTableHeadCell className={styles.notes}>
                {t('user:verification-notes')}
              </DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {checks.map((check: Check) => (
              <DataTableRow key={check}>
                <DataTableCell className={styles.checkbox} hasFormControl>
                  <Checkbox
                    checked={getChecked(check)}
                    onChange={(event: FormEvent<HTMLInputElement>) =>
                      setChecked(event, check)
                    }
                  />
                </DataTableCell>
                <DataTableCell className={styles.check}>
                  {t(`user:verification-${check}`)}
                </DataTableCell>
                <DataTableCell className={styles.notes}>
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
    </>
  );
}
