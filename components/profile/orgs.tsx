import { Chip } from '@rmwc/chip';
import Image from 'next/image';
import Link from 'next/link';
import cn from 'classnames';
import useSWR from 'swr';
import { useState } from 'react';

import Avatar from 'components/avatar';
import VolunteerActivismIcon from 'components/icons/volunteer-activism';

import { Callback } from 'lib/model/callback';
import { ListOrgsRes } from 'lib/api/routes/orgs/list';
import { Org } from 'lib/model/org';
import { User } from 'lib/model/user';

interface OrgCardProps {
  org?: Org;
}

function OrgCard({ org }: OrgCardProps): JSX.Element {
  const [joined, setJoined] = useState<boolean>(false);

  return (
    <Link href={org ? `/${org.id}` : '#'}>
      <a className={cn('card', { loading: !org })}>
        <div className='background'>
          {org?.background && (
            <Image
              priority
              layout='fill'
              objectFit='cover'
              data-cy='backdrop'
              objectPosition='center 50%'
              src={org?.background}
            />
          )}
          <div className='overlay'>
            <div className='chip'>
              <Chip
                label={joined ? 'Volunteered' : `Volunteer at ${org?.name}`}
                onInteraction={() => setJoined((prev) => !prev)}
                onClick={(evt) => {
                  evt.preventDefault();
                  evt.stopPropagation();
                }}
                icon={joined ? undefined : <VolunteerActivismIcon />}
                selected={joined}
                checkmark
              />
            </div>
            <div className='header'>
              <div className='avatar'>
                <Avatar size={48} loading={!org} src={org?.photo} priority />
              </div>
              <h2>{org?.name}</h2>
            </div>
          </div>
        </div>
        <p>{org?.bio}</p>
        <style jsx>{`
          .card {
            border: 1px solid var(--accents-2);
            border-radius: 4px;
            min-width: calc(var(--page-width) / 3 - 24px / 3);
            max-width: calc(var(--page-width) / 3 - 24px / 3);
            overflow: hidden;
            margin: 6px;
            display: block;
            text-decoration: none;
          }

          .background {
            position: relative;
            height: 140px;
            font-size: 0;
            background: var(--accents-2);
          }

          .overlay {
            display: flex;
            align-items: flex-end;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 6px 24px;
            background: linear-gradient(
              180deg,
              transparent 50%,
              var(--background) 100%
            );
          }

          .chip {
            position: absolute;
            top: 24px;
            right: 24px;
          }

          .header {
            display: flex;
            align-items: center;
          }

          .avatar {
            width: 48px;
            height: 48px;
            flex: none;
            border: 1px solid var(--accents-2);
            border-radius: 8px;
            overflow: hidden;
          }

          h2 {
            font-size: 24px;
            font-weight: 600;
            line-height: 1;
            margin: 0 0 0 12px;
            color: var(--on-background);
          }

          p {
            font-size: 14px;
            color: var(--accents-5);
            line-height: 20px;
            height: 80px;
            overflow: hidden;
            margin: 6px 24px 24px;
          }
        `}</style>
      </a>
    </Link>
  );
}

export interface OrgsProps {
  user: User;
  setUser: Callback<User>;
}

export default function Orgs({ user, setUser }: OrgsProps): JSX.Element {
  const { data } = useSWR<ListOrgsRes>('/api/orgs');

  return (
    <div className='wrapper'>
      <div className='scroller'>
        {!data &&
          Array(5)
            .fill(null)
            .map((_, idx) => <OrgCard key={idx} />)}
        {data?.map((o) => (
          <OrgCard org={Org.fromJSON(o)} key={o.id} />
        ))}
      </div>
      <style jsx>{`
        .wrapper {
          max-width: var(--page-width-with-margin);
          padding: 0 24px;
          margin: 48px auto 12px;
        }

        .scroller {
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          margin: -6px;
        }
      `}</style>
    </div>
  );
}
