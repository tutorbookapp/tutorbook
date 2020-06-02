import React, { FC, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogButton,
  DialogProps,
} from '@rmwc/dialog';
import { ApiCallResult } from '@tutorbook/model';
import { Typography } from '@rmwc/typography';
import { IconButton } from '@rmwc/icon-button';

import styles from './http-error-dialog.module.scss';

interface HttpErrorDialogProps extends DialogProps {
  error: ApiCallResult;
}

export const HttpErrorDialog: FC<HttpErrorDialogProps> = ({
  error,
  ...dialogProps
}) => {
  const intl = useIntl();
  const [detailsShown, toggleDetailsShown] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  const code = error.code ?? 'Unknown';
  const details = error.msg.length > 0 ? error.msg : 'No details available';
  const type =
    code >= 400 && code < 500
      ? 'Client'
      : code >= 500 && code < 600
      ? 'Server'
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
      <DialogTitle>
        {intl.formatMessage({ id: 'error-dialog.error-type' }, { type })}
      </DialogTitle>
      <DialogContent>
        <Typography use='body1'>
          {intl.formatMessage({ id: 'error-dialog.suggestion' })}
        </Typography>
        <Typography use='body1'>
          {intl.formatMessage({ id: 'error-dialog.suggestion-report' })}
        </Typography>
        <div className={styles.detailsCtrl}>
          <IconButton
            onClick={toggleDetails}
            className={styles.detailsBtn}
            icon='keyboard_arrow_right'
            onIcon='keyboard_arrow_down'
          />
          <Typography use='button'>
            {intl.formatMessage(
              detailsShown
                ? { id: 'error-dialog.details-hide' }
                : { id: 'error-dialog.details-show' }
            )}
          </Typography>
        </div>
        <div ref={detailsRef} className={styles.details}>
          <Typography use='body2'>
            {intl.formatMessage({ id: 'error-dialog.error-code' }, { code })}
          </Typography>
          <Typography use='body2'>
            {intl.formatMessage(
              { id: 'error-dialog.error-details' },
              { details }
            )}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions className={styles.actions}>
        <DialogButton action='close' raised ripple>
          {intl.formatMessage({ id: 'btn-tag.close' })}
        </DialogButton>
        <DialogButton action='report-error' onClick={requestHelp} raised ripple>
          {intl.formatMessage({ id: 'btn-tag.help' })}
        </DialogButton>
      </DialogActions>
    </Dialog>
  );
};
