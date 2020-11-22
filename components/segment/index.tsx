import { useEffect, useRef } from 'react';
import { SegmentAnalytics } from '@segment/analytics.js-core';
import { dequal } from 'dequal/lite';

import Intercom from 'lib/intercom';
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

  useEffect(() => {
    if (!window.analytics.load) return;
    window.analytics.load(process.env.NEXT_PUBLIC_SEGMENT_KEY as string);
  }, []);

  const prevIdentity = useRef<Record<string, unknown>>();
  useEffect(() => {
    const company = org ? { id: org.id, name: org.name } : undefined;
    const identity = { ...user.toSegment(), company };
    if (dequal(prevIdentity.current, identity)) return;
    if (user.id) {
      console.log(`[ALIAS] ${user.id}`);
      window.analytics.alias(user.id);
    }
    console.log(`[IDENTITY] ${user.toString()}`, identity);
    window.analytics.identify(user.id, identity);
    prevIdentity.current = identity;
  }, [user, org]);

  useEffect(() => {
    Intercom('update', {
      user_hash: user.hash,
      hide_default_launcher: !intercom,
    });
  }, [user.hash, intercom]);

  const prevGroup = useRef<Record<string, unknown>>();
  useEffect(() => {
    const group = org?.toSegment();
    if (!org || !group || dequal(prevGroup.current, group)) return;
    console.log(`[GROUP] ${org.toString()}`, group);
    window.analytics.group(org.id, { ...group, orgId: group.id });
    prevGroup.current = group;
  }, [org]);

  return null;
}
