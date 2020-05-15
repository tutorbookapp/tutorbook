import React from 'react';
import { Router, withRouter } from 'next/router';

import { GetStaticProps, GetStaticPaths } from 'next';
import { AxiosError, AxiosResponse } from 'axios';

import axios from 'axios';
import to from 'await-to-js';

import Utils from '../../covid-utils';
import Intercom from '../../react-intercom';
import ActionText from '../../action-text';
import Header from '../../covid-header';
import Footer from '../../covid-footer';

import { ApiError, Appt, ApptJSONInterface } from '../../model';
import { getIntlProps, getIntlPaths, withIntl } from '../../intl';

interface ApprovePageState {
  appt?: Appt;
  err?: string;
}

/**
 * Duplicate declaration from `./node_modules/next/dist/client/with-router.d.ts`
 * @todo Find some way to import it directly from Next.js (perhaps open a PR to
 * `export` those types from `next/router`).
 */
type WithRouterProps = { router: Router }
type ExcludeRouterProps<P> = Pick<P, Exclude<keyof P, keyof WithRouterProps>>;

/**
 * Page that parents go to when approving (i.e. when giving parental consent
 * for) their child's pending lesson request.
 *
 * The following are sent via URL params in the email CTA link:
 * @param {string} request - The path of the pending lesson request's Firestore
 * document (this should be the path of the parent's child's document if there
 * are multiple pupil attendees).
 * @param {string} uid - The parent's user ID.
 * @todo Is it really required that we have the parent's user ID? Right now, we
 * only allow pupils to add the contact information of one parent. And we don't
 * really care **which** parent approves the lesson request anyways.
 */
class ApprovePage extends React.Component<WithRouterProps> {
  public readonly state: ApprovePageState = { appt: undefined, err: undefined };

  public render(): JSX.Element {
    return (
      <>
        <Header />
        <ActionText
          loading={!this.state.appt && !this.state.err}
          headline={
            this.state.appt
              ? 'Approved'
              : this.state.err
              ? 'Approval Failed'
              : 'Approving...'
          }
          body={
            this.state.appt
              ? this.successMsg
              : this.state.err
              ? this.state.err
              : undefined
          }
        />
        <Footer />
        <Intercom />
      </>
    );
  }

  private get successMsg(): string {
    const appt: Appt = this.state.appt as Appt;
    return (
      `Created tutoring appointments for ${Utils.join(appt.subjects)} ` +
      `on ${appt.time}. The appointment attendees will each receive an email ` +
      `with a link to a Bramble room and instructions for how to make the ` +
      `most out of their virtual tutoring lessons.`
    );
  }

  public async componentDidMount(): Promise<void> {
    console.log('[DEBUG] Approving request...', this.props.router.query);
    const { request, uid } = this.props.router.query;
    const [err, res] = await to<
      AxiosResponse<{ appt: ApptJSONInterface }>,
      AxiosError<ApiError>
    >(
      axios({
        method: 'post',
        url: '/api/appt',
        data: { request, uid },
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
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

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
    router.query = [
      ...new URLSearchParams((router.asPath || '').split(/\?/)[1]).entries(),
    ].reduce((q, [k, v]) => Object.assign(q, { [k]: v }), {});

    return <Component {...(props as any)} router={router} />;
  });
}

export default withIntl(withPageRouter(ApprovePage));
