import { useIntl } from '@tutorbook/intl';
import { SearchResponse, ObjectWithObjectID } from '@algolia/client-search';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import Select, { SelectProps } from '@tutorbook/select';
import { Check, Option } from '@tutorbook/model';

import React from 'react';

import * as config from '@tutorbook/intl/config.json';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

type LocaleCodeAlias = typeof config.locales[number];

type CheckHit = ObjectWithObjectID & { [key in LocaleCodeAlias]: string };

type CheckSelectProps = { values?: Check[] } & Omit<
  SelectProps<Check>,
  'getSuggestions'
>;

export default function CheckSelect({
  values,
  value,
  onChange,
  ...props
}: CheckSelectProps): JSX.Element {
  const searchIndex: React.RefObject<SearchIndex> = React.useRef<SearchIndex>(
    client.initIndex('checks')
  );
  const { locale } = useIntl();

  // TODO: Implement this using `react-async` or `swr`.
  // See https://blog.logrocket.com/how-to-handle-async-side-effects-in-2019/
  React.useEffect(() => {
    const langHitToOption = (lang: CheckHit) => ({
      label: lang[locale],
      value: lang.objectID as Check,
    });

    const updateValue = async (vals: Check[]) => {
      if (!searchIndex.current) throw new Error('No checks search index.');
      const res: SearchResponse<CheckHit> = await searchIndex.current.search(
        '',
        {
          filters: vals.map((val: Check) => `objectID:${val}`).join(' OR '),
        }
      );
      onChange(res.hits.map(langHitToOption));
    };

    if (values && values.length) {
      const valuesHaveLabels = values.every(
        (val: string) =>
          value.findIndex(
            (valueWithLabel: Option<string>) => valueWithLabel.value === val
          ) >= 0
      );
      if (!valuesHaveLabels) void updateValue(values);
    }
  }, []);

  const langHitToOption = (lang: CheckHit) => ({
    label: lang[locale],
    value: lang.objectID as Check,
  });

  /**
   * Updates the suggestions shown in the select below the langs input based
   * on the results of the user's current input to an Algolia search query.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  async function getSuggestions(query = ''): Promise<Option<Check>[]> {
    if (!searchIndex.current) throw new Error('No checks search index.');
    const res: SearchResponse<CheckHit> = await searchIndex.current.search(
      query
    );
    return res.hits.map(langHitToOption);
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
