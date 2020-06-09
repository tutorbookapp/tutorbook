import { useIntl, IntlShape } from '@tutorbook/intl';
import { SearchResponse, ObjectWithObjectID } from '@algolia/client-search';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { SelectProps } from '@tutorbook/select';
import { Option } from '@tutorbook/model';

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

type LangSelectProps = { values?: string[] } & Omit<
  SelectProps<string>,
  'getSuggestions'
>;

export default function LangSelect({
  values,
  ...props
}: LangSelectProps): JSX.Element {
  const searchIndex: SearchIndex = client.initIndex('langs');
  const intl: IntlShape = useIntl();

  // TODO: Implement this using `react-async` or `swr`.
  // See https://blog.logrocket.com/how-to-handle-async-side-effects-in-2019/
  React.useEffect(() => {
    if (values && values.length) {
      const valuesHaveLabels = values.every(
        (value: string) =>
          props.value.findIndex(
            (valueWithLabel: Option<string>) => valueWithLabel.value === value
          ) >= 0
      );
      if (!valuesHaveLabels) updateValue(values);
    } else if (!props.value.length) {
      updateValue([intl.locale]);
    }
  }, [values]);

  const langHitToOption = (lang: LangHit) => ({
    label: lang[intl.locale].name,
    value: lang.objectID,
  });
  const updateValue = async (values: string[]) => {
    const res: SearchResponse<LangHit> = await searchIndex.search('', {
      filters: values.map((val: string) => `objectID:${val}`).join(' OR '),
    });
    props.onChange(res.hits.map(langHitToOption));
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

  return <Select {...props} getSuggestions={getSuggestions} />;
}
