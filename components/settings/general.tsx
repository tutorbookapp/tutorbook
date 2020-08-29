import { useCallback, useEffect, useState, FormEvent } from 'react';
import { TextFieldHelperText } from '@rmwc/textfield';
import axios, { AxiosResponse } from 'axios';
import useTranslation from 'next-translate/useTranslation';
import to from 'await-to-js';

import { OrgInputs } from 'components/inputs';
import Button from 'components/button';
import Loader from 'components/loader';

import { Org, OrgJSON } from 'lib/model';
import { useUser } from 'lib/account';
import Utils from 'lib/utils';

import styles from './general.module.scss';

export interface GeneralProps {
  orgId: string;
}

export default function General({ orgId }: GeneralProps): JSX.Element {
  const { t } = useTranslation();
  const { orgs, updateOrg } = useUser();

  const [org, setOrg] = useState<Org>(new Org());
  const [checked, setChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const idx = orgs.findIndex((o: Org) => o.id === orgId);
    if (idx < 0) throw new Error(`Org (${orgId}) not found in local data.`);
    setOrg(orgs[idx]);
  }, [orgs, orgId]);

  useEffect(() => setError((prev: string) => Utils.period(prev)), [error]);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setChecked(false);
      setLoading(true);
      const url = `/api/orgs/${org.id}`;
      const [err, res] = await to(axios.put<OrgJSON>(url, org.toJSON()));
      if (err) {
        setError(`An error occurred while updating org. ${err.message}`);
        setLoading(false);
      } else {
        const updated = Org.fromJSON((res as AxiosResponse<OrgJSON>).data);
        await updateOrg(org.id, updated);
        setChecked(true);
        setTimeout(() => setLoading(false), 1000);
      }
    },
    [org, updateOrg]
  );

  return (
    <div className={styles.card}>
      <Loader active={loading} checked={checked} />
      <form onSubmit={onSubmit}>
        <div className={styles.inputs}>
          <OrgInputs
            value={org}
            onChange={setOrg}
            className={styles.field}
            name
            email
            phone
            photo
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <OrgInputs
            value={org}
            onChange={setOrg}
            className={styles.field}
            bio
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <OrgInputs
            value={org}
            onChange={setOrg}
            className={styles.field}
            socials
          />
          <Button
            className={styles.btn}
            label={t('org:update-btn')}
            disabled={loading}
            raised
            arrow
          />
          {!!error && (
            <TextFieldHelperText
              persistent
              validationMsg
              className={styles.error}
            >
              {error}
            </TextFieldHelperText>
          )}
        </div>
      </form>
    </div>
  );
}
