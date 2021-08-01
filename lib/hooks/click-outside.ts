import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export interface ClickOutsideProps {
  updateEl: (id: string, el: HTMLElement) => void;
  removeEl: (id: string) => void;
}

export const ClickContext = createContext<ClickOutsideProps>({
  updateEl: () => {},
  removeEl: () => {},
});

export function useClickContext(): ClickOutsideProps {
  return useContext(ClickContext);
}

/**
 * Triggers the given callback whenever a click is detected outside of the given
 * element ref (e.g. to close a menu surface when its surroundings are clicked).
 */
export default function useClickOutside(
  onClickOutside: () => void,
  active: boolean
): ClickOutsideProps {
  const clickableEls = useRef<Record<string, HTMLElement>>({});

  const nodeInClickable = useCallback((el: Node) => {
    const clickable = Object.values(clickableEls.current);
    return clickable.some((e) => e === el || e.contains(el));
  }, []);

  useEffect(() => {
    if (!active) return;
    const outsideClickListener = ({ target }: MouseEvent | TouchEvent) => {
      if (!nodeInClickable(target as Node)) onClickOutside();
    };
    const removeClickListener = () => {
      document.body.removeEventListener('mousedown', outsideClickListener);
      document.body.removeEventListener('touchstart', outsideClickListener);
    };
    document.body.addEventListener('mousedown', outsideClickListener);
    document.body.addEventListener('touchstart', outsideClickListener);
    return removeClickListener;
  }, [active, onClickOutside, nodeInClickable]);

  const wheelEvent = useMemo(() => {
    if (!canUseDOM) return 'mousewheel';
    return 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
  }, []);
  const wheelOpt = useMemo(() => {
    let hasPassive = false;
    try {
      const obj = Object.defineProperty({}, 'passive', {
        get() {
          hasPassive = true;
        },
      });
      window.addEventListener(wheelEvent, () => {}, obj);
    } catch (e) {}
    return (hasPassive ? { passive: false } : false) as EventListenerOptions;
  }, [wheelEvent]);

  const preventDefault = useCallback(
    (e: Event) => {
      if (!nodeInClickable(e.target as Node)) e.preventDefault();
    },
    [nodeInClickable]
  );
  const preventScrollKeys = useCallback(
    (e: KeyboardEvent) => {
      // left: 37, up: 38, right: 39, down: 40,
      // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
      const keys = [37, 38, 39, 40, 32, 33, 34, 35, 36];
      if (keys.includes(e.keyCode)) preventDefault(e);
    },
    [preventDefault]
  );

  useEffect(() => {
    if (!active) return;
    const enableScroll = () => {
      window.removeEventListener('DOMMouseScroll', preventDefault, false);
      window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
      window.removeEventListener('touchmove', preventDefault, wheelOpt);
      window.removeEventListener('keydown', preventScrollKeys, false);
    };
    window.addEventListener('DOMMouseScroll', preventDefault, false);
    window.addEventListener(wheelEvent, preventDefault, wheelOpt);
    window.addEventListener('touchmove', preventDefault, wheelOpt);
    window.addEventListener('keydown', preventScrollKeys, false);
    return enableScroll;
  }, [active, preventDefault, preventScrollKeys, wheelOpt, wheelEvent]);

  const updateEl = useCallback((id: string, el: HTMLElement) => {
    clickableEls.current[id] = el;
  }, []);
  const removeEl = useCallback((id: string) => {
    delete clickableEls.current[id];
  }, []);
  const props = useMemo(() => ({ updateEl, removeEl }), [updateEl, removeEl]);

  return props;
}
