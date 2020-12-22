import { RefObject, useEffect } from 'react';

/**
 * Triggers the given callback whenever a click is detected outside of the given
 * element ref (e.g. to close a menu surface when its surroundings are clicked).
 */
export default function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  callback: () => void
): void {
  useEffect(() => {
    if (!ref.current) return () => {};
    const element = ref.current;
    const removeClickListener = () => {
      // Note that click events aren't triggered when scrollers are interacted
      // with. Thus, we use mouse down events instead.
      document.body.removeEventListener('mousedown', outsideClickListener);
      document.body.removeEventListener('touchstart', outsideClickListener);
    };
    const outsideClickListener = ({ target }: MouseEvent | TouchEvent) => {
      if (element !== target && !element.contains(target as Node)) callback();
    };
    document.body.addEventListener('mousedown', outsideClickListener);
    document.body.addEventListener('touchstart', outsideClickListener);
    return removeClickListener;
  }, [ref, callback]);
}
