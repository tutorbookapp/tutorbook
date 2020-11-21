import { useEffect, useRef } from 'react';
import { dequal } from 'dequal/lite';

export default function useAnalytics<T>(
  event: string,
  traits: () => T,
  throttle = 500
): void {
  const prev = useRef<T>(traits());

  useEffect(() => {
    const updated = traits();
    if (!updated || dequal(prev.current, updated)) return;
    const timeoutId = setTimeout(() => {
      console.log(`[EVENT] ${event}`, updated);
      window.analytics.track(event, updated);
      prev.current = updated;
    }, throttle);
    return () => clearTimeout(timeoutId);
  }, [event, traits, throttle]);
}
