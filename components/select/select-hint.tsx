import { createContext, useContext } from 'react';
import { TooltipProps } from '@rmwc/tooltip';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

// Temporary workaround for not being able to access the `children` prop in the
// fallback loading component (while the `Tooltip` is being dynamically loaded).
// @see {@link https://github.com/vercel/next.js/issues/7906}
const TooltipLoadingContext = createContext<JSX.Element>(<></>);

const Tooltip = dynamic<TooltipProps>(
  () => import('@rmwc/tooltip').then((m) => m.Tooltip),
  { loading: () => useContext(TooltipLoadingContext) }
);

interface SelectHintProps {
  readonly children: JSX.Element;
  readonly open: boolean;
}

export default function SelectHint({
  children,
  open,
}: SelectHintProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <TooltipLoadingContext.Provider value={children}>
      <Tooltip content={t('common:shift-click')} align='topRight' open={open}>
        {children}
      </Tooltip>
    </TooltipLoadingContext.Provider>
  );
}
