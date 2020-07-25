import React from 'react';
import dynamic from 'next/dynamic';
import { TooltipProps } from '@rmwc/tooltip';
import { useMsg } from 'lib/intl';
import { defineMessages } from 'react-intl';

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
  const msg = useMsg();
  const msgs = defineMessages({
    hint: {
      id: 'subject-select.select-hint',
      description:
        'The tooltip text prompting the user to shift-select subjects.',
      defaultMessage: "Use 'SHIFT + click' for multiple select",
    },
  });
  return (
    <Tooltip content={msg(msgs.hint)} align='topRight' open={open}>
      {children}
    </Tooltip>
  );
}
