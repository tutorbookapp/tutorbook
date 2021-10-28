import Link from 'next/link';

import Avatar from 'components/avatar';

import { getEmailLink, getPhoneLink } from 'lib/utils';
import { User } from 'lib/model/user';
import { useOrg } from 'lib/context/org';

export interface ResultProps {
  loading?: boolean;
  user?: User;
}

export default function Result({ loading, user = new User() }: ResultProps): JSX.Element {
  const { org } = useOrg();
  return (
    <Link href={`/${org?.id || 'default'}/users/${user?.id || ''}`}>
      <a className='result'>
        <div className='header'>
          <Avatar className='avatar' src={user.photo} loading={loading} size={100} />
          <div className='content'>
            <span className='name'>{user.name}</span>
            <a href={getEmailLink(user)} target='_blank' rel='noopener noreferrer'>{user.email}</a>
            <a href={getPhoneLink(user)} target='_blank' rel='noopener noreferrer'>{user.phone || '+16508612723'}</a>
            <ul className='subjects'>
              {user.subjects.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <p className='bio'>{user.bio}</p>
          </div>
        </div>
        <table>
          <tr>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
            <th>Saturday</th>
            <th>Sunday</th>
          </tr>
          <tr>
            <td>
              <div className='available'>
                <span>Available</span><br />
                4:00-6:00 PM
              </div>
            </td>
            <td>
              <div className='available'>
                <span>Available</span><br />
                1:00-5:00 PM
              </div>
              <div className='booked'>
                <span>Booked</span><br />
                3:15-4:00 PM<br /> 
                Julia Chiang for Computer Science
              </div>
            </td>
            <td />
            <td>
              <div className='available'>
                <span>Available</span><br />
                1:00-5:00 PM
              </div>
              <div className='booked'>
                <span>Booked</span><br />
                3:15-4:00 PM<br />
                Julia Chiang for Computer Science
              </div>
            </td>
            <td />
            <td />
            <td />
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
          }

          .name {
            font-size: 14px;
            font-weight: 500;
          }

          .header .content a {
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
          }

          .subjects li {
            display: inline-block;
            font-size: 12px;
            line-height: 1;
            background: var(--accents-1);
            border: 1px solid var(--accents-2);
            border-radius: 8px;
            padding: 4px;
            margin: 2px;
          }

          .bio {
            font-size: 12px;
            color: var(--accents-5);
            margin: 0;
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

          td div {
            margin-top: 8px;
            padding: 6px;
            background: var(--accents-1);
            border: 1px solid var(--accents-2);
            border-radius: 8px;
            font-size: 10px;
          }

          td div span {
            text-transform: uppercase;
            font-weight: 500;
          }
        `}</style>
      </a>
    </Link>
  );
}

