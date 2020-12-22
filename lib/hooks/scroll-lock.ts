import { useCallback, useEffect, useMemo } from 'react';

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
const keys = [37, 38, 39, 40, 32, 33, 34, 35, 36];

function preventDefault(e: Event) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e: KeyboardEvent) {
  if (keys.includes(e.keyCode)) preventDefault(e);
}

/**
 * Disables and enables scrolling by cancelling the interaction events that
 * cause scrolling.
 * @see {@link https://stackoverflow.com/a/4770179/10023158}
 */
export default function useScrollLock(locked: boolean): void {
  const wheelEvent = useMemo(() => {
    return 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
  }, []);

  const wheelOpt = useMemo(() => {
    let hasPassive = false;

    try {
      window.addEventListener(
        wheelEvent,
        () => {},
        Object.defineProperty({}, 'passive', {
          get() {
            hasPassive = true;
          },
        })
      );
    } catch (e) {}

    return (hasPassive ? { passive: false } : false) as EventListenerOptions;
  }, [wheelEvent]);

  const disableScroll = useCallback(() => {
    window.addEventListener('DOMMouseScroll', preventDefault, false);
    window.addEventListener(wheelEvent, preventDefault, wheelOpt);
    window.addEventListener('touchmove', preventDefault, wheelOpt);
    window.addEventListener('keydown', preventDefaultForScrollKeys, false);
  }, [wheelOpt, wheelEvent]);

  const enableScroll = useCallback(() => {
    window.removeEventListener('DOMMouseScroll', preventDefault, false);
    window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
    window.removeEventListener('touchmove', preventDefault, wheelOpt);
    window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
  }, [wheelOpt, wheelEvent]);

  useEffect(() => {
    if (!locked) return enableScroll();
    disableScroll();
    return enableScroll;
  }, [locked, disableScroll, enableScroll]);
}
