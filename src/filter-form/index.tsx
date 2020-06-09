import { Option, Query, Callback } from '@tutorbook/model';
import { Ripple } from '@rmwc/ripple';

import React from 'react';
import QueryForm from '@tutorbook/query-form';

import styles from './filter-form.module.scss';

interface SearchButtonProps {
  children: string;
  onClick: (event: React.FormEvent<HTMLButtonElement>) => any;
}

function SearchButton({ onClick, children }: SearchButtonProps): JSX.Element {
  return (
    <Ripple>
      <button onClick={onClick} className={styles.searchButton}>
        {children}
      </button>
    </Ripple>
  );
}

interface FilterFormProps {
  query: Query;
  onChange: Callback<Query>;
}

type FocusTarget = 'subjects' | 'availability' | 'langs' | 'orgs';

export default function FilterForm({
  query,
  onChange,
}: FilterFormProps): JSX.Element {
  const [active, setActive] = React.useState<boolean>(false);
  const formRef: React.RefObject<HTMLDivElement> = React.createRef<
    HTMLDivElement
  >();
  const str: (value: Option<string>[]) => string = (
    value: Option<string>[]
  ) => {
    return value.map((option: Option<string>) => option.label).join(', ');
  };
  const [focused, setFocused] = React.useState<FocusTarget | undefined>();

  React.useEffect(() => {
    if (!formRef.current) return;

    const element: HTMLElement = formRef.current;
    const outsideClickListener = (event: MouseEvent) => {
      if (!element.contains(event.target as any) && active) {
        setActive(false);
        setFocused(undefined);
        removeClickListener();
      }
    };
    const removeClickListener = () => {
      document.removeEventListener('click', outsideClickListener);
    };

    document.addEventListener('click', outsideClickListener);

    return removeClickListener;
  });

  return (
    <>
      <div className={styles.wrapper}>
        <div
          className={styles.form + (active ? ' ' + styles.active : '')}
          ref={formRef}
        >
          <QueryForm
            query={query}
            focusTarget={focused}
            onChange={onChange}
            vertical
            subjects
            langs
            availability={query.aspect === 'tutoring'}
          />
        </div>
      </div>
      <div className={styles.search} role='search'>
        <SearchButton
          onClick={() => {
            setFocused('subjects');
            setActive(true);
          }}
        >
          {str(query.subjects) || 'Any subjects'}
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
              {query.availability.toString() || 'Any availability'}
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
          {str(query.langs) || 'Any language'}
        </SearchButton>
      </div>
    </>
  );
}
