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
import {
  Callback,
  ApiError,
  Check,
  User,
  UserJSON,
  Verification,
} from 'lib/model';
import { defMsg, useMsg, IntlHelper, Msg } from 'lib/intl';
import { socials } from 'lib/intl/msgs';

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
  const [error, setError] = React.useState<string | undefined>();
  const msg: IntlHelper = useMsg();
  const updateUser = async () => {
    const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
      axios.put<UserJSON>(`/api/users/${user.id}`, user)
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
      return onChange(updated);
    }
  };

  const getIndex = (check: Check) =>
    user.verifications.findIndex((v) => v.checks.indexOf(check) >= 0);

  const getChecked = (check: Check) => getIndex(check) >= 0;
  const setChecked = (
    event: React.FormEvent<HTMLInputElement>,
    check: Check
  ) => {
    const verifications: Verification[] = Array.from(user.verifications);
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
    user.verifications.length > 0 &&
    user.verifications.length < Object.keys(checks).length;
  const getAllChecked = () =>
    Object.keys(checks).every((c) => getChecked(c as Check));
  const setAllChecked = (event: React.FormEvent<HTMLInputElement>) => {
    if (!event.currentTarget.checked)
      return onChange({ ...user, verifications: [] });
    const verifications: Verification[] = Array.from(user.verifications);
    const checked: Check[] = Object.values(user.verifications).reduce(
      (acc, cur) => {
        return acc.concat(cur.checks);
      },
      [] as Check[]
    );
    const stillNeedsToBeChecked: Check[] = (Object.keys(
      checks
    ) as Check[]).filter((c) => checked.indexOf(c) < 0);
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
    const verifications: Verification[] = Array.from(user.verifications);
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
