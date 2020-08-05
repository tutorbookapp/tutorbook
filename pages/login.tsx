import { LinkHeader } from 'components/navigation';
import { withI18n } from 'lib/intl';

import React from 'react';
import Login from 'components/login';
import Footer from 'components/footer';
import Intercom from 'components/react-intercom';

import common from 'locales/en/common.json';
import login from 'locales/en/login.json';

function LoginPage(): JSX.Element {
  return (
    <>
      <LinkHeader />
      <Login />
      <Footer />
      <Intercom />
    </>
  );
}

export default withI18n(LoginPage, { common, login });
