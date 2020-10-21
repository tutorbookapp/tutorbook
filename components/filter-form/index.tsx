import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import LangSelect from 'components/lang-select';
import SubjectSelect from 'components/subject-select';
import AvailabilitySelect from 'components/availability-select';

import { Availability, Option, Callback, UsersQuery } from 'lib/model';

import styles from './filter-form.module.scss';

interface SearchButtonProps {
  children: string;
  onClick: (event: FormEvent<HTMLButtonElement>) => void;
}

function SearchButton({ onClick, children }: SearchButtonProps): JSX.Element {
  return (
    <Ripple>
      <button type='button' onClick={onClick} className={styles.searchButton}>
        {children}
      </button>
    </Ripple>
  );
}

function join(options: Option<string>[]): string {
  return options.map((option: Option<string>) => option.label).join(', ');
}

interface FilterFormProps {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
  thirdPerson?: boolean;
}

type FocusTarget = 'subjects' | 'availability' | 'langs';

export default function FilterForm({
  query,
  onChange,
  thirdPerson,
}: FilterFormProps): JSX.Element {
  const [active, setActive] = useState<boolean>(false);
  const [focused, setFocused] = useState<FocusTarget>();

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!formRef.current) return () => {};
    const element: HTMLElement = formRef.current;
    const removeClickListener = () => {
      /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
      document.removeEventListener('click', outsideClickListener);
    };
    const outsideClickListener = (event: MouseEvent) => {
      if (!element.contains(event.target as Node) && active) {
        setActive(false);
        setFocused(undefined);
        removeClickListener();
      }
    };
    document.addEventListener('click', outsideClickListener);
    return removeClickListener;
  });

  useEffect(() => {
    setActive((prev: boolean) => prev || !!focused);
  }, [focused]);

  const onSubmit = useCallback((evt: FormEvent) => {
    evt.preventDefault();
    setActive(false);
  }, []);
  const onSubjectsChange = useCallback(
    (subjects: Option<string>[]) => {
      onChange((prev) => new UsersQuery({ ...prev, subjects }));
    },
    [onChange]
  );
  const onAvailabilityChange = useCallback(
    (availability: Availability) => {
      onChange((prev) => new UsersQuery({ ...prev, availability }));
    },
    [onChange]
  );
  const onLangsChange = useCallback(
    (langs: Option<string>[]) => {
      onChange((prev) => new UsersQuery({ ...prev, langs }));
    },
    [onChange]
  );

  const focusSubjects = useCallback(() => setFocused('subjects'), []);
  const focusAvailability = useCallback(() => setFocused('availability'), []);
  const focusLangs = useCallback(() => setFocused('langs'), []);
  const focusNothing = useCallback(() => setFocused(undefined), []);

  const { t } = useTranslation();

  return (
    <>
      <div className={styles.wrapper}>
        <form
          className={cn(styles.form, { [styles.active]: active })}
          onSubmit={onSubmit}
          ref={formRef}
        >
          <SubjectSelect
            className={styles.field}
            focused={focused === 'subjects'}
            label={t(`query${thirdPerson ? '3rd' : ''}:subjects`)}
            onFocused={focusSubjects}
            onBlurred={focusNothing}
            onSelectedChange={onSubjectsChange}
            selected={query.subjects}
            placeholder={t(`common:${query.aspect}-subjects-placeholder`)}
            aspect={query.aspect}
            outlined
          />
          <AvailabilitySelect
            className={styles.field}
            focused={focused === 'availability'}
            label={t(`query${thirdPerson ? '3rd' : ''}:availability`)}
            onFocused={focusAvailability}
            onBlurred={focusNothing}
            onChange={onAvailabilityChange}
            value={query.availability}
            outlined
          />
          <LangSelect
            className={styles.field}
            focused={focused === 'langs'}
            label={t(`query${thirdPerson ? '3rd' : ''}:langs`)}
            onFocused={focusLangs}
            onBlurred={focusNothing}
            onSelectedChange={onLangsChange}
            selected={query.langs}
            outlined
          />
        </form>
      </div>
      <div className={styles.search} role='search'>
        <SearchButton onClick={focusSubjects}>
          {join(query.subjects) || t('search:any-subjects')}
        </SearchButton>
        <span className={styles.searchDivider} />
        <SearchButton onClick={focusAvailability}>
          {query.availability.toString() || t('search:any-availability')}
        </SearchButton>
        <span className={styles.searchDivider} />
        <SearchButton onClick={focusLangs}>
          {join(query.langs) || t('search:any-langs')}
        </SearchButton>
      </div>
    </>
  );
}
