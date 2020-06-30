import React from 'react';
import { Router, withRouter } from 'next/router';

import { GetStaticProps, GetStaticPaths } from 'next';
import axios, { AxiosError, AxiosResponse } from 'axios';

import to from 'await-to-js';

import Utils from 'lib/utils';
import Intercom from 'components/react-intercom';
import ActionText from 'components/action-text';
import Footer from 'components/footer';

import { LinkHeader } from 'components/header';
import { ApiError, Appt, ApptJSON } from 'lib/model';
import {
  getIntlProps,
  getIntlPaths,
  withIntl,
  injectIntl,
  defMsg,
  Msg,
  IntlShape,
  IntlHelper,
} from 'lib/intl';

const msgs: Record<string, Msg> = defMsg({
  approved: {
    id: 'approve-page.approved',
    defaultMessage: 'Approved Request',
    description:
      'Header for the parental approval page telling the parent that they ' +
      'have successfully approved of the pending lesson request.',
  },
  failed: {
    id: 'approve-page.failed',
    defaultMessage: 'Approval Failed',
    description:
      'Header for the parental approval page telling the parent that we ' +
      'encountered an error while approving the pending lesson request (and ' +
      'thus the lesson request was not approved).',
  },
  approving: {
    id: 'approve-page.approving',
    defaultMessage: 'Approving . . .',
    description: 'Loading message for the parental approval page.',
  },
  success: {
    id: 'approve-page.success',
    defaultMessage:
      'Created tutoring appointments for {subjects}. The ' +
      'appointment attendees will each receive an email with a link to a ' +
      'Bramble room and instructions for how to make the most out of their ' +
      'virtual tutoring lessons.',
    description:
      'Body message telling the parent that they have successfully approved ' +
      'and created a tutoring appointment.',
  },
});

interface ApprovePageState {
  appt?: Appt;
  err?: string;
}

/**
 * Duplicate declaration from `./node_modules/next/dist/client/with-router.d.ts`
 * @todo Find some way to import it directly from Next.js (perhaps open a PR to
 * `export` those types from `next/router`).
 */
type WithRouterProps = { router: Router };
type ExcludeRouterProps<P> = Pick<P, Exclude<keyof P, keyof WithRouterProps>>;

type ApprovePageProps = WithRouterProps & { intl: IntlShape };

/**
 * Page that parents go to when approving (i.e. when giving parental consent
 * for) their child's pending lesson request.
 *
 * The following are sent via URL params in the email CTA link:
 * @param {string} request - The path of the pending lesson request's Firestore
 * document (this should be the path of the parent's child's document if there
 * are multiple pupil attendees).
 * @param {string} id - The parent's user ID.
 * @todo Is it really required that we have the parent's user ID? Right now, we
 * only allow pupils to add the contact information of one parent. And we don't
 * really care **which** parent approves the lesson request anyways.
 */
class ApprovePage extends React.Component<ApprovePageProps, ApprovePageState> {
  public constructor(props: ApprovePageProps) {
    super(props);
    this.state = {};
  }

  public async componentDidMount(): Promise<void> {
    const { router } = this.props;
    console.log('[DEBUG] Approving request...', router.query);
    const { request, id } = router.query;
    const [err, res] = await to<
      AxiosResponse<{ appt: ApptJSON }>,
      AxiosError<ApiError>
    >(
      axios({
        method: 'post',
        url: '/api/appt',
        data: { request, id },
      })
    );
    if (err && err.response) {
      console.error(`[ERROR] ${err.response.data.msg}`, err.response.data);
      this.setState({ err: err.response.data.msg });
    } else if (err && err.request) {
      console.error('[ERROR] No response received:', err.request);
    } else if (err) {
      console.error('[ERROR] While sending request:', err);
    } else if (res) {
      this.setState({ appt: Appt.fromJSON(res.data.appt) });
    }
  }

  private get successMsg(): string {
    const { intl } = this.props;
    const { appt } = this.state;
    return intl.formatMessage(msgs.success, {
      subjects: Utils.join((appt as Appt).subjects),
    });
  }

  public render(): JSX.Element {
    const { appt, err } = this.state;
    const { intl } = this.props;
    const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
    const intermediateHeadline = err ? msg(msgs.failed) : msg(msgs.approving);
    return (
      <>
        <LinkHeader />
        <ActionText
          loading={!appt && !err}
          headline={appt ? msg(msgs.approved) : intermediateHeadline}
          body={appt ? this.successMsg : err}
        />
        <Footer />
        <Intercom />
      </>
    );
  }
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

/**
 * Ensures Next.js parses client-side query post-hydration.
 * @see {@link https://github.com/zeit/next.js/issues/9066}
 */
function withPageRouter<P extends WithRouterProps>(
  Component: React.ComponentType<P>
): React.ComponentType<ExcludeRouterProps<P>> {
  return withRouter<P>(({ router, ...props }) => {
    /* eslint-disable-next-line no-param-reassign */
    router.query = [
      ...new URLSearchParams((router.asPath || '').split(/\?/)[1]).entries(),
    ].reduce((q, [k, v]) => Object.assign(q, { [k]: v }), {});

    return <Component {...(props as any)} router={router} />;
  });
}

export default withIntl(withPageRouter(injectIntl(ApprovePage)));
