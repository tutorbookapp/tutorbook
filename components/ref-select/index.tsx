import { ObjectWithObjectID, SearchResponse } from '@algolia/client-search';
import { memo, useCallback, useEffect, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { Option } from 'lib/model';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);
const searchIndex = client.initIndex('refs');

interface RefHit extends ObjectWithObjectID {
  name: string;
}

export type RefSelectProps = SelectControllerProps<string>;

export default memo(
  function RefSelect({
    value,
    onChange,
    selected,
    onSelectedChange,
    ...props
  }: RefSelectProps): JSX.Element {
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

    // Search the Algolia index to get select suggestions (for drop-down menu).
    const getSuggestions = useCallback(async (query = '') => {
      const res: SearchResponse<RefHit> = await searchIndex.search(query);
      return res.hits.map((hit) => ({ label: hit.name, value: hit.name }));
    }, []);

    // Sync the controlled values (i.e. subject codes) with the internally stored
    // `selectedOptions` state **only** if they don't already match.
    useEffect(() => {
      setSelectedOptions((prev: Option<string>[]) => {
        // If they already match, do nothing.
        if (!value) return prev;
        if (!value.length) return [];
        if (
          dequal(
            prev.map((o) => o.value),
            value
          )
        )
          return prev;
        // Otherwise, update the options based on the subject codes.
        return value.map((val) => ({ label: val, value: val }));
        // TODO: Add i18n to refs by including labels for all languages in that
        // search index (and then fetching the correct labels for the given subject
        // codes here by searching that index).
      });
    }, [value]);

    // Expose API surface to directly control the `selectedOptions` state.
    useEffect(() => {
      setSelectedOptions((prev: Option<string>[]) => {
        if (!selected || dequal(prev, selected)) return prev;
        return selected;
      });
    }, [selected]);

    const { t } = useTranslation();

    return (
      <Select
        {...props}
        autoOpenMenu
        value={selectedOptions}
        onChange={onSelectedOptionsChange}
        getSuggestions={getSuggestions}
        noResultsMessage={t('common:no-refs')}
      />
    );
  },
  (prevProps: RefSelectProps, nextProps: RefSelectProps) => {
    return dequal(prevProps, nextProps);
  }
);
