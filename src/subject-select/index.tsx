import { SearchResponse, ObjectWithObjectID } from '@algolia/client-search';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { Aspect, GradeAlias } from '@tutorbook/model';
import { SelectProps } from '@tutorbook/select';

import Select from '@tutorbook/select';

import algoliasearch from 'algoliasearch/lite';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

type SubjectSelectProps = Omit<SelectProps, 'searchIndex'> & {
  aspect: Aspect;
  grade?: GradeAlias;
  options?: string[];
};

interface SubjectHit extends ObjectWithObjectID {
  name: string;
}

export default function SubjectSelect({
  options,
  aspect,
  grade,
  ...props
}: SubjectSelectProps): JSX.Element {
  const searchIndex: SearchIndex = client.initIndex(aspect);

  /**
   * Updates the suggestions shown in the select below the subjects input based
   * on the results of the user's current input to an Algolia search query.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  async function getSuggestions(query: string = ''): Promise<string[]> {
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
    return res.hits.map((subject: SubjectHit) => subject.name);
  }

  return <Select {...props} getSuggestions={getSuggestions} />;
}
