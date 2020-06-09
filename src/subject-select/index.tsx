import { SearchResponse, ObjectWithObjectID } from '@algolia/client-search';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { Option, Aspect, GradeAlias } from '@tutorbook/model';
import { SelectProps } from '@tutorbook/select';

import React from 'react';
import Select from '@tutorbook/select';

import algoliasearch from 'algoliasearch/lite';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

interface UniqueSubjectSelectProps {
  values?: string[];
  options?: string[];
  aspect: Aspect;
  grade?: GradeAlias;
}

type SubjectSelectProps = Omit<
  SelectProps<string>,
  keyof UniqueSubjectSelectProps | 'getSuggestions'
> &
  UniqueSubjectSelectProps;

interface SubjectHit extends ObjectWithObjectID {
  name: string;
}

export default function SubjectSelect({
  values,
  options,
  aspect,
  grade,
  ...props
}: SubjectSelectProps): JSX.Element {
  const searchIndex: SearchIndex = client.initIndex(aspect);

  // TODO: This will become an async update function that filters our Algolia
  // search index to get the labels of the selected subjects (using their IDs).
  React.useEffect(() => {
    if (!values) return;
    const valuesHaveLabels = values.every(
      (value: string) =>
        props.value.findIndex(
          (valueWithLabel: Option<string>) => valueWithLabel.value === value
        ) >= 0
    );
    if (!valuesHaveLabels)
      props.onChange(values.map((v) => ({ label: v, value: v })));
  }, [values]);

  /**
   * Updates the suggestions shown in the select below the subjects input based
   * on the results of the user's current input to an Algolia search query.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  async function getSuggestions(query: string = ''): Promise<Option<string>[]> {
    if (options && !options.length) return [];
    const filters: string | undefined =
      options !== undefined
        ? options.map((subject: string) => `name:"${subject}"`).join(' OR ')
        : undefined;
    const optionalFilters: string[] | undefined =
      grade !== undefined ? [`grades:${grade}`] : undefined;
    const res: SearchResponse<SubjectHit> = await searchIndex.search(query, {
      filters,
      optionalFilters,
    });
    return res.hits.map((subject: SubjectHit) => ({
      label: subject.name,
      value: subject.name,
    }));
  }

  return <Select {...props} getSuggestions={getSuggestions} />;
}
