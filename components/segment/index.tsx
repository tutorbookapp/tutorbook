import { SegmentAnalytics } from '@segment/analytics.js-core';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

declare global {
  interface Window {
    analytics: SegmentAnalytics.AnalyticsJS & { load?: (key: string) => void };
  }
}

export interface SegmentProps {
  intercom?: boolean;
}

export default function Segment({ intercom }: SegmentProps): null {
  const { org } = useOrg();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!window.analytics.load) return;
    window.analytics.load(process.env.NEXT_PUBLIC_SEGMENT_KEY as string);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => window.analytics.page();
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    const website = user.socials.filter((s) => s.type === 'website')[0];
    window.analytics.identify(
      user.id,
      {
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.photo,
        description: user.bio,
        website: website?.url,
        company: org ? { id: org.id, name: org.name } : undefined,
      },
      {
        integrations: {
          Intercom: { userHash: user.hash, hideDefaultLauncher: !intercom },
        },
      }
    );
  }, [user, org, intercom]);

  useEffect(() => {
    if (!org) return;
    const website = org.socials.filter((s) => s.type === 'website')[0];
    window.analytics.group(org.id, {
      name: org.name,
      email: org.email,
      phone: org.phone,
      avatar: org.photo,
      description: org.bio,
      website: website?.url,
    });
  }, [org]);

  return null;
}
