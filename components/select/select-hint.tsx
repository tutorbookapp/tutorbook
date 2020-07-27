import React from 'react';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';
import { TooltipProps } from '@rmwc/tooltip';

const Tooltip = dynamic<TooltipProps>(async () =>
  import('@rmwc/tooltip').then((mod) => mod.Tooltip)
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
