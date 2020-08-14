import { ObjectWithObjectID, SearchResponse } from '@algolia/client-search';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import algoliasearch, { SearchClient } from 'algoliasearch/lite';
import equal from 'fast-deep-equal';

import Select, { SelectControllerProps } from 'components/select';

import { Aspect, GradeAlias, Option } from 'lib/model';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

interface SubjectHit extends ObjectWithObjectID {
  name: string;
}

interface SubjectSelectProps {
  options?: string[];
  grade?: GradeAlias;
  aspect?: Aspect;
}

/**
 * The `SubjectSelect` is a `Select` controller which means that it:
 * 1. Provides the `value` and `onChange` API surface on which to control the
 * values currently selected (i.e. the selected locale codes).
 * 2. Also exposes (an optional) `selected` and `onSelectedChange` API surface
 * that can be used to directly control the `selectedOptions`.
 * 3. Implements a `getSuggestions` callback that searches the `aspect` Algolia
 * index for relevant subjects (while filtering by `options` and `grade`).
 */
export default function SubjectSelect({
  value,
  onChange,
  selected,
  onSelectedChange,
  options,
  aspect,
  grade,
  ...props
}: SelectControllerProps<string> & SubjectSelectProps): JSX.Element {
  // Directly control the `Select` component with this internal state.
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

  // Search the Algolia index (filtering by options and grade) to get select
  // options/suggestions (for the drop-down menu).
  const searchIndexes = useMemo(() => {
    if (aspect) return [client.initIndex(aspect)];
    return [client.initIndex('tutoring'), client.initIndex('mentoring')];
  }, [aspect]);
  const getSuggestions = useCallback(
    async (query = '') => {
      if (options && !options.length) return [];
      const filters: string | undefined =
        options !== undefined
          ? options.map((subject: string) => `name:"${subject}"`).join(' OR ')
          : undefined;
      const optionalFilters: string[] | undefined =
        grade !== undefined ? [`grades:${grade}`] : undefined;
      const suggestions: Set<string> = new Set();
      await Promise.all(
        searchIndexes.map(async (index) => {
          const res: SearchResponse<SubjectHit> = await index.search(query, {
            filters,
            optionalFilters,
          });
          res.hits.forEach(({ name }) => suggestions.add(name));
        })
      );
      return Array.from(suggestions).map((label) => ({ label, value: label }));
    },
    [options, grade, searchIndexes]
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
      // Otherwise, update the options based on the subject codes.
      return value.map((val: string) => ({ label: val, value: val }));
      // TODO: Add i18n to subjects by including labels for all languages in that
      // search index (and then fetching the correct labels for the given subject
      // codes here by searching that index).
    });
  }, [value]);

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
