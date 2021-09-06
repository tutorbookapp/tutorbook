import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
} from '@rmwc/data-table';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { DBHoursCumulative } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';

export interface HoursProps {
  user?: User;
}

export default function Hours({ user }: HoursProps): JSX.Element {
  const { data } = useSWR<DBHoursCumulative[]>(
    user ? `/api/users/${user.id}/hours` : null
  );
  const { lang: locale } = useTranslation();

  return (
    <div className='wrapper'>
      <DataTable>
        <DataTableContent>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell>Date</DataTableHeadCell>
              <DataTableHeadCell>Students</DataTableHeadCell>
              <DataTableHeadCell>Subjects</DataTableHeadCell>
              <DataTableHeadCell>Description</DataTableHeadCell>
              <DataTableHeadCell>Start Time</DataTableHeadCell>
              <DataTableHeadCell>End Time</DataTableHeadCell>
              <DataTableHeadCell>Duration</DataTableHeadCell>
              <DataTableHeadCell>Total</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {!data &&
              Array(10)
                .fill(null)
                .map((_, idx) => (
                  <DataTableRow key={idx}>
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell />
                  </DataTableRow>
                ))}
            {data?.map((d) => (
              <DataTableRow key={`${d.id}-${d.instance_time}`}>
                <DataTableCell>
                  {new Date(d.instance_time).toLocaleString(locale, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                  })}
                </DataTableCell>
                <DataTableCell>
                  {join(
                    (d.people || [])
                      .filter((p) => p.roles?.includes('tutee'))
                      .map((p) => p.name)
                  )}
                </DataTableCell>
                <DataTableCell>{join(d.subjects)}</DataTableCell>
                <DataTableCell>{d.description}</DataTableCell>
                <DataTableCell>
                  {new Date(d.instance_time).toLocaleString(locale, {
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </DataTableCell>
                <DataTableCell>
                  {new Date(
                    new Date(d.instance_time).valueOf() +
                      new Date(d.time.to).valueOf() -
                      new Date(d.time.from).valueOf()
                  ).toLocaleString(locale, {
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </DataTableCell>
                <DataTableCell>{d.hours} hours</DataTableCell>
                <DataTableCell>{d.total} hours</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTableContent>
      </DataTable>
      <style jsx>{`
        .wrapper {
          max-width: var(--page-width-with-margin);
          margin: 48px auto;
          padding: 0 24px;
        }

        .wrapper :global(table) {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
