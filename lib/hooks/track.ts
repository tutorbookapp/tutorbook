import { useCallback } from 'react';

import { useOrg } from 'lib/context/org';

const queue: Record<string, ReturnType<typeof setTimeout>> = {};

type Props = Record<string, unknown>;
type Track = (event: string, props?: Props, throttle?: number) => void;

export default function useTrack(): Track {
  const { org } = useOrg();

  const track = useCallback(
    (event: string, props?: Props, throttle = 1000) => {
      if (queue[event]) clearTimeout(queue[event]);
      queue[event] = setTimeout(() => {
        console.log(`[EVENT] ${event}`, props);
        window.analytics.track(event, { org: org?.toSegment(), ...props });
      }, throttle);
    },
    [org]
  );

  return track;
}
