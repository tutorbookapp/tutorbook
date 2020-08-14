import React from 'react';
import { TooltipProps } from '@rmwc/tooltip';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

const Tooltip = dynamic<TooltipProps>(() =>
  import('@rmwc/tooltip').then((m) => m.Tooltip)
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
    <Tooltip content={t('common:shift-click')} align='topRight' open={open}>
      {children}
    </Tooltip>
  );
}
