import React from 'react';
import UserDialog from 'components/user-dialog';

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
import { useUser } from 'lib/account';
import { Callback, Check, User, UserJSON, Verification } from 'lib/model';

import useTranslation from 'next-translate/useTranslation';
import styles from './verification-dialog.module.scss';

const checks: Check[] = [
  'background-check',
  'email',
  'academic-email',
  'training',
  'interview',
];

interface VerificationDialogProps {
  user: UserJSON;
  onClosed: () => void;
  onChange: Callback<UserJSON>;
}

export default function VerificationDialog({
  user,
  onClosed,
  onChange,
}: VerificationDialogProps): JSX.Element {
  const { user: currentUser } = useUser();
  const { t } = useTranslation();

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
    const verifications: Verification[] = clone(user.verifications);
    if (getIndex(check) >= 0 && !event.currentTarget.checked) {
      verifications.splice(getIndex(check), 1);
    } else {
      verifications.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      });
    }
    return onChange({ ...user, verifications });
  };

  const getSomeChecked = () =>
    user.verifications.length > 0 && user.verifications.length < checks.length;
  const getAllChecked = () => checks.every((c) => getChecked(c));
  const setAllChecked = (event: React.FormEvent<HTMLInputElement>) => {
    if (!event.currentTarget.checked)
      return onChange({ ...user, verifications: [] });
    const verifications: Verification[] = clone(user.verifications);
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
      verifications.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      })
    );
    return onChange({ ...user, verifications });
  };

  const getValue = (check: Check) =>
    (user.verifications[getIndex(check)] || {}).notes || '';
  const setValue = (event: React.FormEvent<HTMLInputElement>, check: Check) => {
    const verifications: Verification[] = clone(user.verifications);
    if (getIndex(check) >= 0) {
      verifications[getIndex(check)].notes = event.currentTarget.value;
    } else {
      verifications.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: event.currentTarget.value,
        created: new Date(),
        updated: new Date(),
      });
    }
    return onChange({ ...user, verifications });
  };

  return (
    <UserDialog
      className={styles.dialog}
      onClosed={onClosed}
      user={User.fromJSON(user)}
    >
      <h6 className={styles.header}>{t('verifications:title')}</h6>
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
                {t('verifications:description')}
              </DataTableHeadCell>
              <DataTableHeadCell>{t('verifications:notes')}</DataTableHeadCell>
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
                <DataTableCell>{t(`verifications:${check}`)}</DataTableCell>
                <DataTableCell>
                  <TextField
                    value={getValue(check)}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                      setValue(event, check)
                    }
                    className={styles.textField}
                  />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTableContent>
      </DataTable>
    </UserDialog>
  );
}
