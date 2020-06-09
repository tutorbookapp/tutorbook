import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Typography } from '@rmwc/typography';
import { Tooltip } from '@rmwc/tooltip';

interface SelectHintProps {
  readonly children: JSX.Element;
  readonly open: boolean;
}

export default function SelectHint(props: SelectHintProps): JSX.Element {
  return (
    <Tooltip
      content={
        <Typography use='caption'>
          <FormattedMessage
            id='subject-select.select-hint'
            description={
              'The tooltip text prompting the user to shift-select subjects.'
            }
            defaultMessage="Use 'SHIFT + click' for multiple select"
          />
        </Typography>
      }
      align='topRight'
      open={props.open}
    >
      {props.children}
    </Tooltip>
  );
}
