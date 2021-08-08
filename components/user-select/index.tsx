import { useCallback, useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { UsersQuery, UsersQueryInterface } from 'lib/model/query/users';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { Option } from 'lib/model/query/base';
import { User } from 'lib/model/user';
import { fetcher } from 'lib/fetch';

export type UserSelectProps = SelectControllerProps<string> & {
  query: Partial<UsersQueryInterface>;
};

export default function UserSelect({
  query,
  value,
  onChange,
  selected,
  onSelectedChange,
  ...props
}: UserSelectProps): JSX.Element {
  const [options, setOptions] = useState<Option<string>[]>(selected || []);
  const onOptionsChange = useCallback(
    (os: Option<string>[]) => {
      setOptions(os);
      if (onSelectedChange) onSelectedChange(os);
      if (onChange) onChange(os.map(({ value: val }) => val));
    },
    [onSelectedChange, onChange]
  );

  const getSuggestions = useCallback(
    async (search: string = '') => {
      const qry = new UsersQuery({ ...query, search });
      const { users: results } = await fetcher<ListUsersRes>(qry.endpoint);
      const users = results.map((u) => User.fromJSON(u));
      return users.map((u) => ({ label: u.name, value: u.id, key: u.id }));
    },
    [query]
  );

  useEffect(() => {
    setOptions((prev: Option<string>[]) => {
      const prevValue = prev.map((p) => p.value);
      if (!value || dequal(prevValue, value)) return prev;
      return value.map((u) => ({ label: u, value: u, key: u }));
    });
  }, [value]);
  useEffect(() => {
    setOptions((prev: Option<string>[]) => {
      if (!selected || dequal(prev, selected)) return prev;
      return selected;
    });
  }, [selected]);

  const { t } = useTranslation();

  return (
    <Select
      {...props}
      value={options}
      onChange={onOptionsChange}
      getSuggestions={getSuggestions}
      noResultsMessage={t('common:no-users')}
    />
  );
}
