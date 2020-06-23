import React from 'react';
import Utils from '@tutorbook/utils';
import UserDialog from '@tutorbook/user-dialog';

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
import { useUser } from '@tutorbook/account';
import { ApiError, Check, User, Verification } from '@tutorbook/model';
import { defMsg, useIntl, IntlShape, IntlHelper, Msg } from '@tutorbook/intl';
import { socials } from '@tutorbook/intl/msgs';

import axios, { AxiosResponse, AxiosError } from 'axios';
import to from 'await-to-js';

import styles from './verification-dialog.module.scss';

interface VerificationDialogProps {
  user: User;
  onClosed: () => void;
}

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

export default function VerificationDialog({
  user,
  onClosed,
}: VerificationDialogProps): JSX.Element {
  const { user: currentUser } = useUser();
  const { id } = user;

  const [error, setError] = React.useState<string | undefined>();
  const [verifications, setVerifications] = React.useState<Verification[]>(
    user.verifications
  );

  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (m: Msg, v: any) => intl.formatMessage(m, v);

  React.useEffect(() => {
    void (async function update() {
      const [err] = await to<
        AxiosResponse<{ verifications: Verification[] }>,
        AxiosError<ApiError>
      >(
        axios({
          method: 'post',
          url: '/api/verify',
          data: { verifications, id },
        })
      );
      if (err && err.response) {
        setError(
          `An error occurred while creating your verification. ${Utils.period(
            err.response.data.msg || err.message
          )}`
        );
      } else if (err && err.request) {
        setError(
          'An error occurred while creating your verification. Please check your Internet connection and try again.'
        );
      } else if (err) {
        setError(
          `An error occurred while creating your verification. ${Utils.period(
            err.message
          )} Please check your Internet connection and try again.`
        );
      }
    })();
  }, [verifications, id]);

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
