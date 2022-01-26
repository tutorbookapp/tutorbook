import { useCallback, useEffect, useRef, useState } from 'react';
import Router from 'next/router';

import FilterForm from 'components/filter-form';
import Title from 'components/title';

import { UsersQuery } from 'lib/model/query/users';
import { useTheme } from 'lib/context/theme';

interface SectionProps {
  header: string;
  children: string;
  video: string;
}

function Section({ header, children, video }: SectionProps): JSX.Element {
  const { dark } = useTheme();
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => ref.current?.load(), [dark]);
  return (
    <section>
      <div className='content-wrapper'>
        <div className='content'>
          <h2>{header}</h2>
          <p>{children}</p>
        </div>
      </div>
      <div className='wrapper'>
        <div className='video-wrapper'>
          <div className='video'>
            <video
              autoPlay
              loop
              muted
              playsInline
              width='100%'
              height='100%'
              ref={ref}
            >
              <source
                src={`/about/${video}${dark ? '-dark' : ''}.mp4`}
                type='video/mp4'
              />
            </video>
          </div>
        </div>
      </div>
      <style jsx>{`
        section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: row;
          margin: 48px 0;
        }

        section:nth-child(even) {
          flex-direction: row-reverse;
        }

        section h2 {
          font-size: 24px;
          font-weight: 600;
          line-height: 1.45;
          margin: 0 0 8px;
        }

        section p {
          font-size: 24px;
          font-weight: 400;
          line-height: 1.45;
          margin: 0;
        }

        .content-wrapper {
          width: 45%;
          display: flex;
          align-items: center;
        }

        .wrapper {
          width: 45%;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid var(--accents-2);
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          z-index: 0;
          padding-top: 100%;
          background: transparent;
        }

        .video {
          position: absolute;
          inset: 0px;
          height: 100%;
          width: 100%;
        }
      `}</style>
    </section>
  );
}

export default function About(): JSX.Element {
  const [query, setQuery] = useState<UsersQuery>(new UsersQuery());
  const onSubmit = useCallback(async () => {
    await Router.push(query.getURL('/search'));
  }, [query]);
  useEffect(() => {
    void Router.prefetch(query.getURL('/search'));
  }, [query]);

  return (
    <main>
      <header>
        <Title>
          Volunteer tutors for
          <br />
          every subject imaginable
        </Title>
      </header>
      <FilterForm query={query} onChange={setQuery} onSubmit={onSubmit} />
      <article>
        <Section header='1. Search' video='search'>
          Start by exploring our volunteer tutors. Apply filters like subject,
          availability, and language to narrow your options.
        </Section>
        <Section header='2. Book' video='book'>
          Once you’ve found a tutor you like, book a meeting with them in just a
          few clicks. You’ll both receive an email with contact info and your
          meeting link.
        </Section>
        <Section header='3. Meet' video='meet'>
          You’re all set! Manage your meetings and track service hours—all
          through Tutorbook. You can also contact us anytime for additional
          support.
        </Section>
      </article>
      <style jsx>{`
        main {
          max-width: var(--page-width-with-margin);
          margin: 0 auto;
          padding: 0 24px;
        }

        header {
          text-align: center;
          margin: 48px 0;
        }

        article {
          margin: 96px auto;
        }
      `}</style>
    </main>
  );
}
