import { Option, UsersQuery, Callback } from 'lib/model';
import { QueryInputs } from 'components/inputs';
import { Ripple } from '@rmwc/ripple';

import React, { useState, useCallback, useEffect, useRef } from 'react';

import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';
import styles from './filter-form.module.scss';

interface SearchButtonProps {
  children: string;
  onClick: (event: React.FormEvent<HTMLButtonElement>) => void;
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

interface FilterFormProps {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
}

type FocusTarget = 'subjects' | 'availability' | 'langs';

export default function FilterForm({
  query,
  onChange,
}: FilterFormProps): JSX.Element {
  const [active, setActive] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const str: (value: Option<string>[]) => string = (
    value: Option<string>[]
  ) => {
    return value.map((option: Option<string>) => option.label).join(', ');
  };
  const [focused, setFocused] = useState<FocusTarget | undefined>();

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

  const onSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    setActive(false);
  }, []);

  const { t } = useTranslation();

  return (
    <>
      <div className={styles.wrapper}>
        <form
          className={cn(styles.form, { [styles.active]: active })}
          onSubmit={onSubmit}
          ref={formRef}
        >
          <QueryInputs
            value={query}
            focused={focused}
            onChange={onChange}
            className={styles.field}
            thirdPerson
            subjects
            langs
            availability={query.aspect === 'tutoring'}
          />
        </form>
      </div>
      <div className={styles.search} role='search'>
        <SearchButton
          onClick={() => {
            setFocused('subjects');
            setActive(true);
          }}
        >
          {str(query.subjects) || t('search:any-subjects')}
        </SearchButton>
        {query.aspect === 'tutoring' && (
          <>
            <span className={styles.searchDivider} />
            <SearchButton
              onClick={() => {
                setFocused('availability');
                setActive(true);
              }}
            >
              {query.availability.toString() || t('search:any-availability')}
            </SearchButton>
          </>
        )}
        <span className={styles.searchDivider} />
        <SearchButton
          onClick={() => {
            setFocused('langs');
            setActive(true);
          }}
        >
          {str(query.langs) || t('search:any-langs')}
        </SearchButton>
      </div>
    </>
  );
}
