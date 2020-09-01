import React, { useCallback, useEffect, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

import LangSelect from 'components/lang-select';
import SubjectSelect from 'components/subject-select';

import { Option, UsersQuery } from 'lib/model';

import { InputsConfig, InputsProps } from './types';

type Input = 'subjects' | 'langs';

export default function UsersQueryInputs({
  value,
  onChange,
  focused: focusTarget,
  thirdPerson,
  renderToPortal,
  className,
  subjects,
  langs,
}: InputsProps<UsersQuery, Input> & InputsConfig<Input>): JSX.Element {
  const onSubjectsChange = useCallback(
    (s: Option<string>[]) => {
      onChange(new UsersQuery({ ...value, subjects: s }));
    },
    [onChange, value]
  );
  const onLangsChange = useCallback(
    (l: Option<string>[]) => {
      onChange(new UsersQuery({ ...value, langs: l }));
    },
    [onChange, value]
  );

  const { t } = useTranslation();
  const [focused, setFocused] = useState<Input | undefined>(focusTarget);

  const focusSubjects = useCallback(() => setFocused('subjects'), []);
  const focusLangs = useCallback(() => setFocused('langs'), []);
  const focusNothing = useCallback(() => setFocused(undefined), []);

  useEffect(() => setFocused(focusTarget), [focusTarget]);

  return (
    <>
      {subjects && (
        <SubjectSelect
          focused={focused === 'subjects'}
          label={t(`query${thirdPerson ? '3rd' : ''}:subjects`)}
          onFocused={focusSubjects}
          onBlurred={focusNothing}
          onSelectedChange={onSubjectsChange}
          selected={value.subjects}
          placeholder={t(`common:${value.aspect}-subjects-placeholder`)}
          aspect={value.aspect}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {langs && (
        <LangSelect
          focused={focused === 'langs'}
          label={t(`query${thirdPerson ? '3rd' : ''}:langs`)}
          onFocused={focusLangs}
          onBlurred={focusNothing}
          onSelectedChange={onLangsChange}
          selected={value.langs}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
    </>
  );
}
