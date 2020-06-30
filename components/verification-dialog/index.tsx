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
import { TextField, TextFieldHelperText } from '@rmwc/textfield';
import { useUser } from 'lib/account';
import { ApiError, Check, User, UserJSON, Verification } from 'lib/model';
import { defMsg, useMsg, IntlHelper, Msg } from 'lib/intl';
import { socials } from 'lib/intl/msgs';
import { responseInterface } from 'swr';

import axios, { AxiosResponse, AxiosError } from 'axios';
import to from 'await-to-js';

import styles from './verification-dialog.module.scss';

const checks: Record<Check, Msg> = defMsg({
  dbs: {
    id: 'checks.dbs',
    defaultMessage: 'DBS Check',
  },
  email: {
    id: 'checks.email',
    defaultMessage: 'Verified email address',
  },
  'academic-email': {
    id: 'check.academic-email',
    defaultMessage: 'University email address',
  },
  training: {
    id: 'checks.training',
    defaultMessage: 'Safeguarding training',
  },
  ...socials,
});

interface VerificationDialogProps {
  user: User;
  onClosed: () => void;
  mutate: responseInterface<UserJSON[], Error>['mutate'];
}

export default function VerificationDialog({
  user,
  onClosed,
  mutate,
}: VerificationDialogProps): JSX.Element {
  const { user: currentUser } = useUser();

  const [error, setError] = React.useState<string | undefined>();
  const [verifications, setVerifications] = React.useState<Verification[]>(
    user.verifications
  );

  const msg: IntlHelper = useMsg();

  const updateUser = async () => {
    const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
      axios.put<UserJSON>(`/api/users/${user.id}`, { ...user, verifications })
    );
    if (err && err.response) {
      setError(
        `An error occurred while updating ${user.name}: ${err.response.data.msg}`
      );
    } else if (err && err.request) {
      setError(
        `An error occurred while updating ${user.name}. Please check your Internet connection and try again.`
      );
    } else if (err) {
      setError(`An error occurred while updating ${user.name}: ${err.message}`);
    } else {
      const { data: updated } = res as AxiosResponse<UserJSON>;
      /* eslint-disable-next-line @typescript-eslint/require-await */
      await mutate(async (users: UserJSON[]) => {
        if (!users) return users;
        const idx: number = users.findIndex((u) => u.id === updated.id);
        if (idx < 0) return users;
        return [...users.slice(0, idx), updated, ...users.slice(idx + 1)];
      }, false);
    }
  };

  const getIndex = (check: Check) =>
    verifications.findIndex((v) => v.checks.indexOf(check) >= 0);

  const getChecked = (check: Check) => getIndex(check) >= 0;
  const setChecked = (
    event: React.FormEvent<HTMLInputElement>,
    check: Check
  ) => {
    const copy: Verification[] = Array.from(verifications);
    if (getIndex(check) >= 0 && !event.currentTarget.checked) {
      copy.splice(getIndex(check), 1);
    } else {
      copy.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: '',
        created: new Date(),
        updated: new Date(),
      });
    }
    setVerifications(copy);
  };

  const getSomeChecked = () =>
    verifications.length > 0 &&
    verifications.length < Object.keys(checks).length;
  const getAllChecked = () =>
    Object.keys(checks).every((c) => getChecked(c as Check));
  const setAllChecked = (event: React.FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.checked) {
      const copy: Verification[] = Array.from(verifications);
      const checked: Check[] = Object.values(verifications).reduce(
        (acc, cur) => {
          return acc.concat(cur.checks);
        },
        [] as Check[]
      );
      const stillNeedsToBeChecked: Check[] = (Object.keys(
        checks
      ) as Check[]).filter((c) => checked.indexOf(c) < 0);
      stillNeedsToBeChecked.forEach((check: Check) =>
        copy.push({
          user: currentUser.id,
          org: currentUser.id,
          checks: [check],
          notes: '',
          created: new Date(),
          updated: new Date(),
        })
      );
      setVerifications(copy);
    } else {
      setVerifications([]);
    }
  };

  const getValue = (check: Check) =>
    (verifications[getIndex(check)] || {}).notes || '';
  const setValue = (event: React.FormEvent<HTMLInputElement>, check: Check) => {
    const copy: Verification[] = Array.from(verifications);
    if (getIndex(check) >= 0) {
      copy[getIndex(check)].notes = event.currentTarget.value;
    } else {
      copy.push({
        user: currentUser.id,
        org: currentUser.id,
        checks: [check],
        notes: event.currentTarget.value,
        created: new Date(),
        updated: new Date(),
      });
    }
    setVerifications(copy);
  };

  return (
    <UserDialog className={styles.dialog} onClosed={onClosed} user={user}>
      <h6 className={styles.header}>Verifications</h6>
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
              <DataTableHeadCell>Description</DataTableHeadCell>
              <DataTableHeadCell>Notes</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {Object.entries(checks).map(([check, label]: [string, Msg]) => (
              <DataTableRow key={check}>
                <DataTableCell hasFormControl>
                  <Checkbox
                    checked={getChecked(check as Check)}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                      setChecked(event, check as Check)
                    }
                    onBlur={() => updateUser()}
                  />
                </DataTableCell>
                <DataTableCell>{msg(label)}</DataTableCell>
                <DataTableCell>
                  <TextField
                    value={getValue(check as Check)}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                      setValue(event, check as Check)
                    }
                    className={styles.textField}
                    onBlur={() => updateUser()}
                  />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTableContent>
      </DataTable>
      <>
        {!!error && (
          <TextFieldHelperText
            persistent
            validationMsg
            className={styles.error}
          >
            {error}
          </TextFieldHelperText>
        )}
      </>
    </UserDialog>
  );
}
