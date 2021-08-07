import { ObjectWithObjectID, SearchResponse } from '@algolia/client-search';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { GradeAlias } from 'lib/model/user';
import { Option } from 'lib/model/query/base';
import { intersection } from 'lib/utils';
import { useOrg } from 'lib/context/org';
import usePrevious from 'lib/hooks/previous';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);

interface SubjectHit extends ObjectWithObjectID {
  name: string;
}

interface UniqueSubjectSelectProps {
  options?: string[];
  grade?: GradeAlias;
}

export type SubjectSelectProps = SelectControllerProps<string> &
  UniqueSubjectSelectProps;

function SubjectSelect({
  value,
  onChange,
  selected,
  onSelectedChange,
  options: subjectOptions,
  placeholder: subjectPlaceholder,
  grade,
  ...props
}: SubjectSelectProps): JSX.Element {
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

  // Only show subjects that fit into both the current org's subjects and the
  // requested `subjectOptions`.
  // @see {@link https://github.com/tutorbookapp/tutorbook/issues/133}
  const { org } = useOrg();
  const options = useMemo(() => {
    if (org?.subjects) return intersection(org?.subjects, subjectOptions);
    return subjectOptions;
  }, [org?.subjects, subjectOptions]);
  const placeholder = useMemo(() => {
    if (!options || !options.length) return subjectPlaceholder;
    return `Ex: ${options.slice(0, 2).join(' or ')}`;
  }, [options, subjectPlaceholder]);

  // Search the Algolia index (filtering by options and grade) to get select
  // options/suggestions (for the drop-down menu).
  const searchIndexes = useMemo(
    () => [client.initIndex('tutoring'), client.initIndex('mentoring')],
    []
  );
  const getSuggestions = useCallback(
    async (query = '') => {
      if (options && !options.length) return [];
      const filters: string | undefined =
        options !== undefined
          ? options.map((subject: string) => `name:"${subject}"`).join(' OR ')
          : undefined;
      const optionalFilters: string[] | undefined =
        grade !== undefined ? [`grades:${grade}`] : undefined;
      const suggestions: Option<string>[] = [];
      await Promise.all(
        searchIndexes.map(async (index) => {
          const res: SearchResponse<SubjectHit> = await index.search(query, {
            filters,
            optionalFilters,
          });
          res.hits.forEach((h: SubjectHit) => {
            if (suggestions.findIndex((s) => s.label === h.name) >= 0) return;
            suggestions.push({ label: h.name, value: h.name });
          });
        })
      );
      return suggestions;
    },
    [options, grade, searchIndexes]
  );

  // Sync the controlled values (i.e. subject codes) with the internally stored
  // `selectedOptions` state **only** if they don't already match.
  useEffect(() => {
    setSelectedOptions((prev: Option<string>[]) => {
      // If they already match, do nothing.
      if (!value) return prev;
      if (!value.length) return [];
      if (
        dequal(
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
      if (!selected || dequal(prev, selected)) return prev;
      return selected;
    });
  }, [selected]);

  // Don't allow selections not included in `options` prop.
  useEffect(() => {
    setSelectedOptions((prev: Option<string>[]) => {
      const os = prev.filter((s) => !options || options.includes(s.value));
      if (dequal(os, prev)) return prev;
      if (onSelectedChange) onSelectedChange(os);
      if (onChange) onChange(os.map(({ value: val }) => val));
      return os;
    });
  }, [options, onSelectedChange, onChange]);

  const { t } = useTranslation();
  const prevOptions = usePrevious(options);

  return (
    <Select
      {...props}
      value={selectedOptions}
      placeholder={placeholder}
      onChange={onSelectedOptionsChange}
      getSuggestions={getSuggestions}
      noResultsMessage={t('common:no-subjects')}
      forceUpdateSuggestions={!dequal(prevOptions, options)}
    />
  );
}

export default memo(SubjectSelect, dequal);
