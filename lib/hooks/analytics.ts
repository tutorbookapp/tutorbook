import { useEffect, useRef } from 'react';
import { dequal } from 'dequal/lite';

import useTrack from 'lib/hooks/track';

type Falsy = '' | false | null | undefined;

export default function useAnalytics<T extends Record<string, unknown> | Falsy>(
  event: string,
  traits: () => T,
  throttle = 500
): void {
  const prev = useRef<T>(traits());
  const track = useTrack();

  useEffect(() => {
    const updated = traits();
    if (!updated || dequal(prev.current, updated)) return;
    const timeoutId = setTimeout(() => {
      track(event, updated as Record<string, unknown>);
      prev.current = updated;
    }, throttle);
    return () => clearTimeout(timeoutId);
  }, [track, event, traits, throttle]);
}
