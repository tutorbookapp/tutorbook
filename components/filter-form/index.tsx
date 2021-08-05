import useTranslation from 'next-translate/useTranslation';

import AvailabilitySelect from 'components/availability-select';
import LangSelect from 'components/lang-select';
import SearchIcon from 'components/icons/search';
import SubjectSelect from 'components/subject-select';

import { Callback } from 'lib/model/callback';
import { UsersQuery } from 'lib/model/query/users';

export interface FilterFormProps {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
  onSubmit: () => void;
}

export default function FilterForm({
  query,
  onChange,
  onSubmit,
}: FilterFormProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <form
      onSubmit={(evt) => {
        evt.preventDefault();
        onSubmit();
      }}
    >
      <SubjectSelect
        className='field'
        label={t('query3rd:subjects')}
        onSelectedChange={(subjects) =>
          onChange((prev) => new UsersQuery({ ...prev, subjects, page: 0 }))
        }
        selected={query.subjects}
        placeholder={t(`common:${query.aspect}-subjects-placeholder`)}
        aspect={query.aspect}
        outlined
      />
      <AvailabilitySelect
        className='field'
        label={t('query3rd:availability')}
        onChange={(availability) =>
          onChange((prev) => new UsersQuery({ ...prev, availability, page: 0 }))
        }
        value={query.availability}
        outlined
      />
      <LangSelect
        className='field'
        label={t('query3rd:langs')}
        placeholder={t('common:langs-placeholder')}
        onSelectedChange={(langs) =>
          onChange((prev) => new UsersQuery({ ...prev, langs, page: 0 }))
        }
        selected={query.langs}
        outlined
      />
      <button className='reset button' type='button'>
        <SearchIcon />
      </button>
      <style jsx>{`
        form {
          background: var(--background);
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--accents-2);
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          z-index: 8;
        }
        
        :global(html:not(.dark)) form {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        form > :global(.field) {
          margin: 0 8px;
          flex-grow: 1.5;
          flex-basis: 0;
          width: 100%;
        }
        
        form > :global(.field:first-child) {
          margin-left: 0;
        }

        form > :global(.field:last-child) {
          margin-right: 0;
        }

        .button {
          flex: none;
          margin: 0 0 0 8px;
          min-height: 56px;
          max-height: 56px;
          background: var(--primary);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          border-radius: 8px;
          padding ${(56 - 24) / 2}px;
        }
        
        .button > :global(svg) {
          fill: var(--on-primary);
        }
      `}</style>
    </form>
  );
}
