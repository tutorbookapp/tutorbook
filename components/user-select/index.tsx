import { useCallback, useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { UsersQuery, UsersQueryInterface } from 'lib/model/query/users';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { Option } from 'lib/model/query/base';
import { User } from 'lib/model/user';
import { fetcher } from 'lib/fetch';

export type UserSelectProps = SelectControllerProps<User> & {
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
  const [options, setOptions] = useState<Option<User>[]>(selected || []);
  const onOptionsChange = useCallback(
    (os: Option<User>[]) => {
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
      return users.map((u) => ({ label: u.name, value: u, key: u.id }));
    },
    [query]
  );

  useEffect(() => {
    setOptions((prev: Option<User>[]) => {
      const prevValue = prev.map((p) => p.value);
      if (!value || dequal(prevValue, value)) return prev;
      return value.map((u) => ({ label: u.name, value: u, key: u.id }));
    });
  }, [value]);
  useEffect(() => {
    setOptions((prev: Option<User>[]) => {
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
