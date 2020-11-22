import { useCallback } from 'react';

import { useOrg } from 'lib/context/org';

const queue: Record<string, ReturnType<typeof setTimeout>> = {};

type Track = (event: string, props?: unknown, throttle?: number) => void;

export default function useTrack(): Track {
  const { org } = useOrg();

  const track = useCallback(
    (event: string, props?: unknown, throttle = 1000) => {
      if (queue[event]) clearTimeout(queue[event]);
      queue[event] = setTimeout(() => {
        const properties = { org: org?.toSegment(), ...(props as object) };
        console.log(`[EVENT] ${event}`, properties);
        window.analytics.track(event, properties);
      }, throttle);
    },
    [org]
  );

  return track;
}
