import NProgress from 'nprogress';
import Router from 'next/router';

let timeout: ReturnType<typeof setTimeout>;

const start = () => {
  timeout = setTimeout(() => NProgress.start(), 150);
};

const done = () => {
  clearTimeout(timeout);
  NProgress.done();
};

Router.events.on('routeChangeStart', start);
Router.events.on('routeChangeComplete', done);
Router.events.on('routeChangeError', done);

export default function Progress(): null {
  return null;
}
