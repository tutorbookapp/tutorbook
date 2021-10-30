import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import Select, { SelectControllerProps } from 'components/select';

import { Subject } from 'lib/model/subject';
import { SubjectsQuery } from 'lib/model/query/subjects';
import { TCallback } from 'lib/model/callback';
import { Option } from 'lib/model/query/base';
import { intersection } from 'lib/utils';
import { useOrg } from 'lib/context/org';
import usePrevious from 'lib/hooks/previous';

export type SubjectSelectProps = 
  Omit<SelectControllerProps<string>, 'value' | 'onChange'> &
  { value: Subject[]; onChange: TCallback<Subject[]>; options?: Subject[] };

function optionToSubject(option: Option<string>): Subject {
  return { id: Number(option.value || option.key), name: option.label };
}
function subjectToOption(subject: Subject): Option<string> {
  return { value: subject.id.toString(), label: subject.name, key: subject.id.toString() };
}

function SubjectSelect({
  value,
  onChange,
  selected,
  onSelectedChange,
  options: subjectOptions,
  placeholder: subjectPlaceholder,
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
      if (onChange) onChange(os.map(optionToSubject));
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
    return `Ex: ${options.slice(0, 2).map((s) => s.name).join(' or ')}`;
  }, [options, subjectPlaceholder]);

  // Search the Algolia index (filtering by options and grade) to get select
  // options/suggestions (for the drop-down menu).
  const getSuggestions = useCallback(
    async (search = '') => {
      if (options && !options.length) return [];
      const query = new SubjectsQuery({ search, options });
      const { data } = await axios.get<Subject[]>(query.endpoint);
      return data.map(subjectToOption);
    },
    [options]
  );

  // Sync the controlled values (i.e. subject codes) with the internally stored
  // `selectedOptions` state **only** if they don't already match.
  useEffect(() => {
    setSelectedOptions((prev: Option<string>[]) => {
      // If they already match, do nothing.
      const prevValue = prev.map((p) => p.value);
      if (!value || dequal(prevValue, value)) return prev;
      if (!value.length) return [];
      // Otherwise, update the options based on the subject codes.
      return value.map(subjectToOption);
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
      const os = prev.filter((s) => !options || options.some((o) => o.id === Number(s.value)));
      if (dequal(os, prev)) return prev;
      if (onSelectedChange) onSelectedChange(os);
      if (onChange) onChange(os.map(optionToSubject));
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
