import { User, UserJSON, Option, Query } from 'lib/model';

import Select, { SelectControllerProps } from 'components/select';

import React from 'react';
import axios from 'axios';
import equal from 'fast-deep-equal';

interface UserSelectProps {
  orgs?: string[];
  parents?: string[];
}

/**
 * Each `Option` object's label is the user's name and value is the user's uID.
 * We use a `Query` object and call the `/api/users` API endpoint to get
 * suggestions. We concurrently call the `/api/users/[id]` API endpoint to get
 * the labels (i.e. the user names) for the initial `value`.
 *
 * Other than those changes, this is implemented essentially the same way as the
 * `SubjectSelect` or the `LangSelect` (as a wrapper around a `Select`).
 *
 * @param [orgs] - The organizations that the search results should belong to.
 * @param [parents] - The parents of the search results (note that this combines
 * with the `orgs` parameter in an ` OR ` sequence... results will show up when
 * either are `true`).
 */
export default function UserSelect({
  value,
  onChange,
  selected,
  onSelectedChange,
  orgs,
  parents,
  ...props
}: SelectControllerProps<string> & UserSelectProps): JSX.Element {
  // Store a cache of labels fetched (i.e. a map of values and labels).
  const cache = React.useRef<Record<string, string>>({});

  // Directly control the `Select` component (just like the `SubjectSelect`).
  const [selectedOptions, setSelectedOptions] = React.useState<
    Option<string>[]
  >(selected || []);
  const onSelectedOptionsChange = React.useCallback(
    (os: Option<string>[]) => {
      setSelectedOptions(os);
      if (onSelectedChange) onSelectedChange(os);
      if (onChange) onChange(os.map(({ value: val }) => val));
    },
    [onSelectedChange, onChange]
  );

  // Call the `/api/users` API endpoint to get suggestions.
  const userToOption = React.useCallback((user: User | UserJSON) => {
    cache.current[user.id] = user.name;
    return { label: user.name, value: user.id };
  }, []);
  const getSuggestions = React.useCallback(
    async (query: string = '') => {
      const promises: Promise<{ users: User[] }>[] = [];
      if (orgs && orgs.length)
        promises.push(
          new Query({
            query,
            orgs: orgs.map((id) => ({ label: id, value: id })),
          }).search()
        );
      if (parents && parents.length)
        promises.push(
          new Query({
            query,
            parents: parents.map((id) => ({ label: id, value: id })),
          }).search()
        );
      const suggestions: Option<string>[] = [];
      (await Promise.all(promises)).forEach(({ users }) => {
        users.forEach((user: User) => {
          if (suggestions.findIndex(({ value: id }) => id === user.id) < 0)
            suggestions.push(userToOption(user));
        });
      });
      return suggestions;
    },
    [userToOption, orgs, parents]
  );

  // Sync the controlled values (i.e. subject codes) with the internally stored
  // `selectedOptions` state **only** if they don't already match.
  React.useEffect(
    () =>
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
              const { data: user } = await axios.get<UserJSON>(
                `/api/users/${id}`
              );
              return user;
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
      }),
    [value, userToOption]
  );

  // Expose API surface to directly control the `selectedOptions` state.
  React.useEffect(
    () =>
      setSelectedOptions((prev: Option<string>[]) => {
        if (!selected || equal(prev, selected)) return prev;
        return selected;
      }),
    [selected]
  );

  return (
    <Select
      {...props}
      value={selectedOptions}
      onChange={onSelectedOptionsChange}
      getSuggestions={getSuggestions}
    />
  );
}
