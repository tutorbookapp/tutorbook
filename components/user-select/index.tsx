import { useUser, useOrgs } from 'lib/account';
import { User, UserJSON, Option, UsersQuery } from 'lib/model';

import Select, { SelectControllerProps } from 'components/select';
import React, { useRef, useState, useCallback, useEffect } from 'react';

import axios from 'axios';
import equal from 'fast-deep-equal';

/**
 * Each `Option` object's label is the user's name and value is the user's uID.
 * We use a `Query` object and call the `/api/users` API endpoint to get
 * suggestions. We concurrently call the `/api/users/[id]` API endpoint to get
 * the labels (i.e. the user names) for the initial `value`.
 *
 * Other than those changes, this is implemented essentially the same way as the
 * `SubjectSelect` or the `LangSelect` (as a wrapper around a `Select`).
 */
export default function UserSelect({
  value,
  onChange,
  selected,
  onSelectedChange,
  ...props
}: SelectControllerProps<string>): JSX.Element {
  // Only show users that are either:
  // a) Within one of the orgs that the current user is an admin of.
  // b) A child of the current user.
  const { user } = useUser();
  const { orgs } = useOrgs();

  // Store a cache of labels fetched (i.e. a map of values and labels).
  const cache = useRef<Record<string, string>>({});

  // Directly control the `Select` component (just like the `SubjectSelect`).
  const [selectedOptions, setSelectedOptions] = useState<Option<string>[]>(
    selected || []
  );
  const onSelectedOptionsChange = useCallback(
    (os: Option<string>[]) => {
      setSelectedOptions(os);
      if (onSelectedChange) onSelectedChange(os);
      if (onChange) onChange(os.map(({ value: val }) => val));
    },
    [onSelectedChange, onChange]
  );

  // Call the `/api/users` API endpoint to get suggestions.
  const userToOption = useCallback((u: User | UserJSON) => {
    cache.current[u.id] = u.name;
    return { label: u.name, value: u.id };
  }, []);
  const getSuggestions = useCallback(
    async (query: string = '') => {
      const promises: Promise<{ users: User[] }>[] = [];
      if (orgs.length)
        promises.push(
          new UsersQuery({
            query,
            orgs: orgs.map(({ id, name }) => ({ label: name, value: id })),
          }).search()
        );
      if (user.id)
        promises.push(
          new UsersQuery({
            query,
            parents: [{ label: user.name, value: user.id }],
          }).search()
        );
      const suggestions: Option<string>[] = [];
      (await Promise.all(promises)).forEach(({ users }) => {
        users.forEach((u: User) => {
          if (suggestions.findIndex(({ value: id }) => id === u.id) < 0)
            suggestions.push(userToOption(u));
        });
      });
      return suggestions;
    },
    [userToOption, orgs, user]
  );

  // Sync the controlled values (i.e. subject codes) with the internally stored
  // `selectedOptions` state **only** if they don't already match.
  useEffect(() => {
    setSelectedOptions((prev: Option<string>[]) => {
      // If they already match, do nothing.
      if (!value) return prev;
      if (
        equal(
          prev.map(({ value: val }) => val),
          value
        )
      )
        return prev;
      // Otherwise, fetch the correct labels (i.e. the users's names) by
      // concurrently calling the `/api/users/[id]` for each `value`.
      const updateLabels = async () => {
        const users: UserJSON[] = await Promise.all(
          value.map(async (id) => {
            const { data } = await axios.get<UserJSON>(`/api/users/${id}`);
            return data;
          })
        );
        setSelectedOptions(users.map(userToOption));
      };
      void updateLabels();
      // Then, temporarily update the options based on the IDs and cache.
      return value.map((id) => ({
        label: cache.current[id] || id,
        value: id,
      }));
    });
  }, [value, userToOption]);

  // Expose API surface to directly control the `selectedOptions` state.
  useEffect(() => {
    setSelectedOptions((prev: Option<string>[]) => {
      if (!selected || equal(prev, selected)) return prev;
      return selected;
    });
  }, [selected]);

  return (
    <Select
      {...props}
      value={selectedOptions}
      onChange={onSelectedOptionsChange}
      getSuggestions={getSuggestions}
    />
  );
}
