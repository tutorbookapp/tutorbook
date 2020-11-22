import { useEffect, useRef } from 'react';
import { dequal } from 'dequal/lite';

import useTrack from 'lib/hooks/track';

export default function useAnalytics<T>(
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
      track(event, updated);
      prev.current = updated;
    }, throttle);
    return () => clearTimeout(timeoutId);
  }, [track, event, traits, throttle]);
}
