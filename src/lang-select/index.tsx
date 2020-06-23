import { useIntl } from '@tutorbook/intl';
import { SearchResponse, ObjectWithObjectID } from '@algolia/client-search';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import Select, { SelectProps } from '@tutorbook/select';
import { Option } from '@tutorbook/model';

import React from 'react';

import * as config from '@tutorbook/intl/config.json';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

type LocaleCodeAlias = typeof config.locales[number];

type LangHit = ObjectWithObjectID &
  { [key in LocaleCodeAlias]: { name: string; synonyms: string[] } };

type LangSelectProps = { values?: string[] } & Omit<
  SelectProps<string>,
  'getSuggestions'
>;

const searchIndex: SearchIndex = client.initIndex('langs');

export default function LangSelect({
  value,
  values,
  onChange,
  ...props
}: LangSelectProps): JSX.Element {
  const { locale } = useIntl();

  React.useEffect(() => {
    const updateSelected = async (vals: string[]) => {
      const res: SearchResponse<LangHit> = await searchIndex.search('', {
        filters: vals.map((val: string) => `objectID:${val}`).join(' OR '),
      });
      const selected: Option<string>[] = res.hits.map((lang: LangHit) => ({
        label: lang[locale].name,
        value: lang.objectID,
      }));
      onChange(selected);
    };
    if (values && values.length) {
      // The `values` prop contains an array of locale codes. We must search the
      // `langs` Algolia index to find their corresponding labels (e.g. `en` and
      // `English`) and select them (by calling `props.onChange`).
      const valuesAreSelected = values.every(
        (val) =>
          value.findIndex((option: Option<string>) => option.value === val) >= 0
      );
      if (!valuesAreSelected) void updateSelected(values);
    } else if (!value.length) {
      void updateSelected([locale]);
    }
  }, [values]);

  /**
   * Updates the suggestions shown in the select below the langs input based
   * on the results of the user's current input to an Algolia search query.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  async function getSuggestions(query = ''): Promise<Option<string>[]> {
    const res: SearchResponse<LangHit> = await searchIndex.search(query);
    return res.hits.map((lang: LangHit) => ({
      label: lang[locale].name,
      value: lang.objectID,
    }));
  }

  return (
    <Select
      {...props}
      value={value}
      onChange={onChange}
      getSuggestions={getSuggestions}
    />
  );
}
