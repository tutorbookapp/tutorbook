import useSWR from 'swr';

import { DBTotalHours } from 'lib/model/user';
import { useOrg } from 'lib/context/org';

export default function Hours(): JSX.Element {
  const { org } = useOrg();
  const { data } = useSWR<DBTotalHours[]>(
    org ? `/api/orgs/${org.id}/hours` : null
  );

  return (
    <ul>
      {data &&
        data.map((d) => (
          <li>
            {d.name} {d.org} {d.hours}
          </li>
        ))}
      <style jsx>{``}</style>
    </ul>
  );
}
