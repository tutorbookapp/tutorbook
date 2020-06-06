import { useIntl, IntlShape } from '@tutorbook/intl';
import { SearchResponse, ObjectWithObjectID } from '@algolia/client-search';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { Option, SelectProps } from '@tutorbook/select';

import React from 'react';
import Select from '@tutorbook/select';

import * as config from '@tutorbook/intl/config.json';
import algoliasearch from 'algoliasearch/lite';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

type LocaleCodeAlias = typeof config.locales[number];

type LangHit = ObjectWithObjectID &
  { [key in LocaleCodeAlias]: { name: string; synonyms: string[] } };

type LangSelectProps = Omit<SelectProps<string>, 'getSuggestions' | 'val'> & {
  val: LocaleCodeAlias[];
};

export default function LangSelect({
  val,
  onChange,
  ...props
}: LangSelectProps): JSX.Element {
  const searchIndex: SearchIndex = client.initIndex('langs');
  const intl: IntlShape = useIntl();
  const [value, setValue] = React.useState<Option<string>[]>([]);

  React.useEffect(() => {
    if (!value.length) updateValue();
  });

  const langHitToOption = (lang: LangHit) => ({
    label: lang[intl.locale].name,
    value: lang.objectID,
  });
  const updateValue = async () => {
    const res: SearchResponse<LangHit> = await searchIndex.search('', {
      filters: [intl.locale, ...val].map((l) => `objectID:${l}`).join(' OR '),
    });
    setValue(res.hits.map(langHitToOption));
    if (onChange) onChange(res.hits.map((lang: LangHit) => lang.objectID));
  };

  /**
   * Updates the suggestions shown in the select below the langs input based
   * on the results of the user's current input to an Algolia search query.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  async function getSuggestions(query: string = ''): Promise<Option<string>[]> {
    const res: SearchResponse<LangHit> = await searchIndex.search(query);
    return res.hits.map(langHitToOption);
  }

  return (
    <Select
      {...props}
      val={value}
      onChange={onChange}
      getSuggestions={getSuggestions}
      autoOpenMenu
    />
  );
}
