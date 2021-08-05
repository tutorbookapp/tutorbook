import Router from 'next/router';
import { useState } from 'react';

import FilterForm from 'components/filter-form';
import Title from 'components/title';

import { UsersQuery } from 'lib/model/query/users';

export default function About(): JSX.Element {
  const [query, setQuery] = useState<UsersQuery>(new UsersQuery());

  return (
    <main>
      <header>
        <Title>
          Tutorbook is
          <br />
          Airbnb for tutors
        </Title>
      </header>
      <FilterForm
        query={query}
        onChange={setQuery}
        onSubmit={() => Router.push(query.getURL('/search'))}
      />
      <article>
        <section>
          <div>
            <h2>1. Search</h2>
            <p>
              Start by exploring our tutors. Filter by subject, availability,
              and language.
            </p>
          </div>
          <figure />
        </section>
        <section>
          <figure />
          <div>
            <h2>2. Book</h2>
            <p>
              Once you’ve found a tutor you like, book a meeting with them in
              just a few clicks.
            </p>
          </div>
        </section>
        <section>
          <div>
            <h2>3. Meet</h2>
            <p>
              You’re all set! Manage your meetings and earn service hours—all
              through Tutorbook.
            </p>
          </div>
          <figure />
        </section>
      </article>
      <style jsx>{`
        main {
          max-width: var(--page-width-with-margin);
          margin: 0 auto;
          padding: 0 24px;
          box-sizing: border-box;
        }

        header {
          text-align: center;
          margin: 48px 0;
        }

        header > :global(h1) {
          font-size: 72px;
          font-weight: 700;
          line-height: 1;
        }

        article {
          margin: 96px auto;
        }

        section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 48px 24px;
        }

        section h2 {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.45;
          margin: 0 0 8px;
        }

        section p {
          font-size: 24px;
          font-weight: 400;
          line-height: 1.45;
          margin: 0;
        }

        section div {
          flex: 1 1 auto;
          max-width: 500px;
        }

        section figure {
          background: var(--accents-1);
          border: 1px solid var(--accents-2);
          border-radius: 24px;
          width: 400px;
          height: 400px;
          padding: 0;
          margin: 0;
          flex: none;
        }
      `}</style>
    </main>
  );
}
