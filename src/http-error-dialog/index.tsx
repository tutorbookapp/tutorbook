import React, { FC, useRef, useState } from 'react';
import { useIntl, defineMessages, MessageDescriptor } from 'react-intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogButton,
  DialogProps,
} from '@rmwc/dialog';
import { ApiCallError } from '@tutorbook/custom-errors';
import { Typography } from '@rmwc/typography';
import { IconButton } from '@rmwc/icon-button';

import styles from './http-error-dialog.module.scss';

const msgs: Record<string, MessageDescriptor> = defineMessages({
  type: {
    id: 'http-error-dialog.error-type',
    defaultMessage: 'A {type} error occurred',
  },
  show: {
    id: 'http-error-dialog.details-show',
    defaultMessage: 'Show details',
  },
  hide: {
    id: 'http-error-dialog.details-hide',
    defaultMessage: 'Hide details',
  },
  suggestion: {
    id: 'http-error-dialog.suggestion',
    defaultMessage: 'You can try later, or contact the support team.',
  },
  report: {
    id: 'http-error-dialog.suggestion-report',
    defaultMessage: "Press 'Help' to get support.",
  },
  code: {
    id: 'http-error-dialog.error-code',
    defaultMessage: 'Response status code: {code}',
  },
  details: {
    id: 'http-error-dialog.error-details',
    defaultMessage: 'Error: {details}',
  },
  close: {
    id: 'btn-tag.close',
    defaultMessage: 'Close',
  },
  help: {
    id: 'btn-tag.help',
    defaultMessage: 'Help',
  },
});

interface HttpErrorDialogProps extends DialogProps {
  error: ApiCallError;
}

export const HttpErrorDialog: FC<HttpErrorDialogProps> = ({
  error,
  ...dialogProps
}) => {
  const intl = useIntl();
  const [detailsShown, toggleDetailsShown] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  const code = error.statusCode ?? 'Unknown';
  const details =
    error.message.length > 0 ? error.message : 'No details available';
  const type =
    code >= 400 && code < 500
      ? 'client'
      : code >= 500 && code < 600
      ? 'server'
      : 'Unknown';

  const requestHelp = () => {
    if (window.Intercom) {
      window.Intercom('show');
      return;
    }
    /* Intercom unavailable > redirect to help center */
    window.location.assign(`https://intercom.help/tutorbook/${intl.locale}/`);
  };

  const toggleDetails = () => {
    if (detailsRef.current) {
      detailsRef.current.classList.toggle(styles.shown);
      toggleDetailsShown(!detailsShown);
    }
  };

  return (
    <Dialog {...dialogProps}>
      <DialogTitle>{intl.formatMessage(msgs.type, { type })}</DialogTitle>
      <DialogContent>
        <div className={styles.brief}>
          <Typography use='body1'>
            {intl.formatMessage(msgs.suggestion)}
          </Typography>
          <Typography use='body1'>{intl.formatMessage(msgs.report)}</Typography>
        </div>
        <div className={styles.detailsCtrl}>
          <IconButton
            onClick={toggleDetails}
            className={styles.detailsBtn}
            icon='keyboard_arrow_right'
            onIcon='keyboard_arrow_down'
          />
          <Typography use='button'>
            {intl.formatMessage(detailsShown ? msgs.hide : msgs.show)}
          </Typography>
        </div>
        <div ref={detailsRef} className={styles.details}>
          <Typography use='body2'>
            {intl.formatMessage(msgs.code, { code })}
          </Typography>
          <Typography use='body2'>
            {intl.formatMessage(msgs.details, { details })}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions>
        <DialogButton action='close' unelevated ripple>
          {intl.formatMessage(msgs.close)}
        </DialogButton>
        <DialogButton
          action='report-error'
          onClick={requestHelp}
          unelevated
          ripple
        >
          {intl.formatMessage(msgs.help)}
        </DialogButton>
      </DialogActions>
    </Dialog>
  );
};
