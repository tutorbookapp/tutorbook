import { ObjectWithObjectID, SearchResponse } from '@algolia/client-search';
import { useCallback, useEffect, useRef, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { dequal } from 'dequal';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { Option } from 'lib/model';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);
const searchIndex = client.initIndex('langs');

type LangHit = ObjectWithObjectID & {
  [key: string]: { name: string; synonyms: string[] };
};

/**
 * Orders the list of `LangHits` to match the order they were originally stored.
 * @param hits - The list of `LangHits` to order.
 * @param langs - The list of locale codes that were stored in our database.
 * @return A list of `LangHits` ordered according to the order in `langs`.
 */
function orderLangs(hits: LangHit[], langs: string[]): LangHit[] {
  return hits.sort((first, second) => {
    const firstIdx = langs.findIndex((c) => c === first.objectID);
    const secondIdx = langs.findIndex((c) => c === second.objectID);
    return firstIdx - secondIdx;
  });
}

/**
 * The `LangSelect` is a `Select` controller which means that it:
 * 1. Provides the `value` and `onChange` API surface on which to control the
 * values currently selected (i.e. the selected locale codes).
 * 2. Syncs those values with the internally stored `selectedOptions` state by
 * querying our Algolia search index.
 * 3. Also exposes (an optional) `selected` and `onSelectedChange` API surface
 * that can be used to directly control the `selectedOptions`.
 * 4. Implements a `getSuggestions` callback that searches the Algolia index for
 * relevant subjects (based off the user's `Select`-inputted query).
 */
export default function LangSelect({
  value,
  onChange,
  selected,
  onSelectedChange,
  ...props
}: SelectControllerProps<string>): JSX.Element {
  // Store a cache of labels fetched (i.e. a map of values and labels).
  // TODO: Make sure this is globally stored and can be accessed across pages.
  const cache = useRef<Record<string, LangHit>>({});

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

  // Convert a language search hit to an option (gets the label in the current
  // locale/language).
  const { t, lang: locale } = useTranslation();
  const langHitToOption = useCallback(
    (lang: LangHit) => {
      cache.current[lang.objectID] = lang;
      return { label: lang[locale].name, value: lang.objectID };
    },
    [locale]
  );

  // Searches the Algolia search index based on the user's `textarea` input.
  const getSuggestions = useCallback(
    async (query = '') => {
      const res: SearchResponse<LangHit> = await searchIndex.search(query);
      return res.hits.map(langHitToOption);
    },
    [langHitToOption]
  );

  // Sync the controlled values (i.e. locale codes) with the internally stored
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
      // Otherwise, fetch the correct labels (for those locale codes) by
      // searching our Algolia `langs` index.
      const updateLabelsFromAlgolia = async () => {
        const res: SearchResponse<LangHit> = await searchIndex.search('', {
          filters: value.map((val) => `objectID:${val}`).join(' OR '),
        });
        setSelectedOptions(orderLangs(res.hits, value).map(langHitToOption));
      };
      void updateLabelsFromAlgolia();
      // Then, temporarily update the options based on locale codes and cache.
      return value.map((id: string) => {
        if (cache.current[id]) return langHitToOption(cache.current[id]);
        return { label: id, value: id };
      });
    });
  }, [value, langHitToOption]);

  // Expose API surface to directly control the `selectedOptions` state.
  useEffect(() => {
    setSelectedOptions((prev: Option<string>[]) => {
      if (!selected || dequal(prev, selected)) return prev;
      return selected;
    });
  }, [selected]);

  return (
    <Select
      {...props}
      value={selectedOptions}
      onChange={onSelectedOptionsChange}
      getSuggestions={getSuggestions}
      noResultsMessage={t('common:no-langs')}
    />
  );
}
