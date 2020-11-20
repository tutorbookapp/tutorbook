import { SegmentAnalytics } from '@segment/analytics.js-core';
import { useEffect } from 'react';

declare global {
  interface Window {
    analytics: SegmentAnalytics.AnalyticsJS & { load: (key: string) => void };
  }
}

export default function Segment(): null {
  // As recommended by Segment, we use the CDN version of `analytics.js` as it
  // offers all the project and workspace settings, enabled integrations, etc.
  useEffect(() => {
    window.analytics.load(process.env.NEXT_PUBLIC_SEGMENT_KEY as string);
    window.analytics.page();
  }, []);

  return null;
}
