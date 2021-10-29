import Link from 'next/link';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';

import { getEmailLink, getPhoneLink } from 'lib/utils';
import { User } from 'lib/model/user';
import { getDateWithDay } from 'lib/utils/time';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

export interface ResultProps {
  loading?: boolean;
  user?: User;
}

export default function Result({ loading, user = new User() }: ResultProps): JSX.Element {
  const { org } = useOrg();
  const { lang: locale } = useTranslation();
  const { user: { timezone } } = useUser();
  return (
    <Link href={`/${org?.id || 'default'}/users/${user?.id || ''}`}>
      <a className='result'>
        <div className='header'>
          <Avatar className='avatar' src={user.photo} loading={loading} size={100} />
          <div className='content'>
            <h4 className={cn('name', { loading })}>
              <span>{user.name}</span>
              {!loading && <a href={getEmailLink(user)} target='_blank' rel='noopener noreferrer'>{user.email}</a>}
              {!loading && <a href={getPhoneLink(user)} target='_blank' rel='noopener noreferrer'>{user.phone || '+16508612723'}</a>}
            </h4>
            <ul className='subjects'>
              {user.subjects.map((s) => <li key={s}>{s}</li>)}
              {loading && Array(5).fill(null).map((_, idx) => <li key={idx} className='loading' />)}
            </ul>
            <p className={cn('bio', { loading })}>{user.bio}</p>
          </div>
        </div>
        <table>
          <tr>
            {Array(7).fill(null).map((_, day) => (
              <th key={day}>{getDateWithDay(day).toLocaleString(locale, { weekday: 'long' })}</th> 
            ))}
          </tr>
          <tr>
            {Array(7).fill(null).map((_, day) => (
              <td key={day}>
                <h5 className={cn({ loading })}>{loading ? '' : user.availability.some((t) => t.from.getDay() === day) ? 'Available' : 'Unavailable'}</h5>
                {user.availability.some((t) => t.from.getDay() === day) && (
                  <ul>
                    {user.availability.filter((t) => t.from.getDay() === day).map((t) => (
                      <li>{t.toString(locale, timezone, false, true)}</li>
                    ))}
                  </ul>
                )}
              </td>
            ))}
          </tr>
        </table>
        <style jsx>{`
          .result {
            display: block;
            text-decoration: none;
            color: var(--on-background);
            border-bottom: 1px solid var(--accents-2);
            padding: 12px;
          }

          .result:last-of-type {
            border-bottom: none;
          }

          .header {
            display: flex;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--accents-2);
          }

          .header :global(.avatar) {
            flex: none;
            width: 100px;
          }

          .header .content {
            margin-left: 12px;
            flex-grow: 1;
          }

          .name {
            margin: 0;
          }

          .name.loading {
            width: 100%;
            max-width: 250px;
            height: 16px;
            border-radius: 4px;
            margin-bottom: 6px;
          }

          .name span {
            font-weight: 500;
            font-size: 14px;
            font-weight: 500;
          }

          .name a {
            font-size: 12px;
            font-weight: 400;
            text-decoration: none;
            color: var(--accents-5);
            margin-left: 8px;
          }

          .subjects {
            list-style: none;
            padding: 0;
            margin: 4px -2px;
            display: flex;
            flex-wrap: wrap;
          }

          .subjects li {
            display: block;
            font-size: 12px;
            line-height: 1;
            background-color: var(--accents-1);
            border: 1px solid var(--accents-2);
            border-radius: 8px;
            padding: 4px;
            margin: 2px;
            height: 22px;
          }

          .subjects li.loading {
            width: 75px;
          }

          .bio {
            font-size: 12px;
            color: var(--accents-5);
            overflow: hidden;
            height: 45px;
            width: 100%;
            margin: 0;
          }

          .bio.loading {
            border-radius: 4px;
            margin-top: 6px;
          }

          table {
            table-layout: fixed;
            margin: 8px -12px 0;
            width: 100%;
          }

          th {
            font-size: 12px;
            font-weight: 500;
          }

          td {
            border-left: 1px solid var(--accents-2);
            vertical-align: top;
            padding: 0 8px;
          }

          td:first-child {
            border-left: none;
          }

          td h5 {
            font-size: 10px;
            font-weight: 400;
            text-align: center;
            text-transform: uppercase;
            color: var(--accents-5);
            height: 12.5px;
            margin: 0;
          }

          td h5.loading {
            border-radius: 4px;
            max-width: 100px;
            margin: 4px auto;
          }

          td ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          td li {
            text-align: center;
            font-size: 10px;
            margin: 4px 0;
          }
        `}</style>
      </a>
    </Link>
  );
}

