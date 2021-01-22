import { MenuSurface, MenuSurfaceAnchor } from '@rmwc/menu';
import {
  SyntheticEvent,
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { TextField, TextFieldHTMLProps, TextFieldProps } from '@rmwc/textfield';
import { dequal } from 'dequal/lite';
import { nanoid } from 'nanoid';
import useTranslation from 'next-translate/useTranslation';

import { TCallback, Timeslot } from 'lib/model';
import { useClickContext } from 'lib/hooks/click-outside';

import SelectSurface from './select-surface';
import styles from './time-select.module.scss';

type OverridenProps =
  | 'textarea'
  | 'readOnly'
  | 'onFocus'
  | 'onBlur'
  | 'inputRef'
  | 'className';
interface Props {
  uid?: string;
  value?: Timeslot;
  onChange: TCallback<Timeslot>;
  renderToPortal?: boolean;
  focused?: boolean;
  onFocused?: () => any;
  onBlurred?: () => any;
  className?: string;
}

export type TimeSelectProps = Omit<
  TextFieldHTMLProps,
  keyof Props | OverridenProps
> &
  Omit<TextFieldProps, keyof Props | OverridenProps> &
  Props;

export default memo(
  function TimeSelect({
    uid,
    value,
    onChange,
    renderToPortal,
    focused,
    onFocused,
    onBlurred,
    className,
    ...textFieldProps
  }: TimeSelectProps): JSX.Element {
    const inputRef = useRef<HTMLInputElement>(null);
    useLayoutEffect(() => {
      if (focused) inputRef.current?.focus();
    }, [focused]);

    // We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
    // before toggling which ensures the user hasn't re-opened the menu.
    // @see {@link https:bit.ly/2x9eM27}
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const timeoutId = useRef<ReturnType<typeof setTimeout>>();

    const { lang: locale } = useTranslation();
    const { updateEl, removeEl } = useClickContext();

    const elementId = useRef<string>(`time-select-${nanoid()}`);
    const menuSurfaceRef = useCallback(
      (node: HTMLElement | null) => {
        if (!node) return removeEl(elementId.current);
        return updateEl(elementId.current, node);
      },
      [updateEl, removeEl]
    );

    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          tabIndex={-1}
          open={menuOpen}
          ref={menuSurfaceRef}
          onFocus={(event: SyntheticEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            inputRef.current?.focus();
          }}
          className={styles.surface}
          anchorCorner='bottomStart'
          renderToPortal={renderToPortal ? '#portal' : false}
          data-cy='time-select-surface'
        >
          <SelectSurface uid={uid} onChange={onChange} inputRef={inputRef} />
        </MenuSurface>
        <TextField
          {...textFieldProps}
          readOnly
          textarea={false}
          inputRef={inputRef}
          value={value?.toString(locale) || ''}
          className={styles.field}
          onFocus={() => {
            if (onFocused) onFocused();
            if (timeoutId.current) {
              clearTimeout(timeoutId.current);
              timeoutId.current = undefined;
            }
            setMenuOpen(true);
          }}
          onBlur={() => {
            if (onBlurred) onBlurred();
            timeoutId.current = setTimeout(() => setMenuOpen(false), 0);
          }}
        />
      </MenuSurfaceAnchor>
    );
  },
  (prevProps: TimeSelectProps, nextProps: TimeSelectProps) => {
    return dequal(prevProps, nextProps);
  }
);
