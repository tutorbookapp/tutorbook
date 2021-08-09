import { useCallback, useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { UsersQuery, UsersQueryInterface } from 'lib/model/query/users';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { Option } from 'lib/model/query/base';
import { TCallback } from 'lib/model/callback';
import { User } from 'lib/model/user';
import { fetcher } from 'lib/fetch';
import { useUser } from 'lib/context/user';

interface UserOption extends Option<string> {
  user: User;
}

export type UserSelectProps = SelectControllerProps<string, UserOption> & {
  query: Partial<UsersQueryInterface>;
  users?: User[];
  onUsersChange?: TCallback<User[]>;
};

export default function UserSelect({
  query,
  value,
  onChange,
  selected,
  onSelectedChange,
  users,
  onUsersChange,
  ...props
}: UserSelectProps): JSX.Element {
  const [options, setOptions] = useState<UserOption[]>(selected || []);
  const onOptionsChange = useCallback(
    (os: UserOption[]) => {
      setOptions(os);
      if (onSelectedChange) onSelectedChange(os);
      if (onUsersChange) onUsersChange(os.map((o) => o.user));
      if (onChange) onChange(os.map((o) => o.value));
    },
    [onSelectedChange, onUsersChange, onChange]
  );

  const { loggedIn } = useUser();
  const getSuggestions = useCallback(
    async (search: string = '') => {
      if (!loggedIn) return [];
      const q = new UsersQuery({ ...query, search });
      const { users: results } = await fetcher<ListUsersRes>(q.endpoint);
      return results
        .map((u) => User.fromJSON(u))
        .map((u) => ({ label: u.name, value: u.id, key: u.id, user: u }));
    },
    [query, loggedIn]
  );

  useEffect(() => {
    setOptions((prev: UserOption[]) => {
      const prevValue = prev.map((p) => p.value);
      if (!value || dequal(prevValue, value)) return prev;
      return value.map((u) => ({
        label: u,
        value: u,
        key: u,
        user: new User({ id: u }),
      }));
    });
  }, [value]);
  useEffect(() => {
    setOptions((prev: UserOption[]) => {
      const prevUsers = prev.map((p) => p.user);
      if (!users || dequal(prevUsers, users)) return prev;
      return users.map((u) => ({
        label: u.name,
        value: u.id,
        key: u.id,
        user: u,
      }));
    });
  }, [users]);
  useEffect(() => {
    setOptions((prev: UserOption[]) => {
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
