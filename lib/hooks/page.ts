import { useEffect } from 'react';

export default function usePage(name: string, orgId = 'default'): void {
  useEffect(() => {
    // The `orgId` prop is required to connect events with Mixpanel groups.
    // @see {@link https://bit.ly/36YrRsT}
    window.analytics?.page('', name, { orgId });
  }, [name, orgId]);
}
