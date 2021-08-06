import useTranslation from 'next-translate/useTranslation';

import AvailabilitySelect from 'components/availability-select';
import LangSelect from 'components/lang-select';
import SubjectSelect from 'components/subject-select';
import Title from 'components/title';

import { Callback } from 'lib/model/callback';
import { UsersQuery } from 'lib/model/query/users';

export interface FilterHeaderProps {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
}

export default function FilterHeader({
  query,
  onChange,
}: FilterHeaderProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <div className='title'>
        <Title>Search our volunteers</Title>
      </div>
      <header>
        <form onSubmit={(evt) => evt.preventDefault()}>
          <SubjectSelect
            className='field'
            label={t('query3rd:subjects')}
            onSelectedChange={(subjects) =>
              onChange((prev) => new UsersQuery({ ...prev, subjects, page: 0 }))
            }
            selected={query.subjects}
            placeholder={t('common:subjects-placeholder')}
            outlined
          />
          <AvailabilitySelect
            className='field'
            label={t('query3rd:availability')}
            onChange={(availability) =>
              onChange(
                (prev) => new UsersQuery({ ...prev, availability, page: 0 })
              )
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
        </form>
      </header>
      <style jsx>{`
        .title {
          text-align: center;
          background: var(--background);
          position: relative;
          padding: 48px 0 8px;
          z-index: 9;
        }

        header {
          position: sticky;
          z-index: 8;
          top: 0;
          border-bottom: 1px solid var(--accents-2);
          background: var(--background);
          box-shadow: 0 1px 24px rgba(0, 0, 0, 0.08);
        }

        .logo {
          display: flex;
          align-items: center;
          height: 56px;
          margin-right: 24px;
          cursor: pointer;
          text-decoration: none;
        }

        .logo span {
          color: var(--primary);
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 24px;
          line-height: 24px;
          text-decoration: none;
        }

        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 4px;
          background: none;
          border: none;
          padding: 0;
          margin: 0 0 0 20px;
        }

        form {
          max-width: var(--page-width-with-margin);
          padding: 16px 24px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          display: flex;
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
      `}</style>
    </>
  );
}
