import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Typography } from '@rmwc/typography';
import { Tooltip } from '@rmwc/tooltip';

interface SelectHintProps {
  readonly children: JSX.Element;
}

export const SelectHint: React.FunctionComponent<SelectHintProps> = ({
  children,
}) => (
  <Tooltip
    content={
      <Typography use='caption'>
        <FormattedMessage id='subject-select.select-hint' />
      </Typography>
    }
    align='topRight'
    activateOn='click'
  >
    {children}
  </Tooltip>
);
