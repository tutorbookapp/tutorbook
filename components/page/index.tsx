import { ReactNode } from 'react';

import Footer from 'components/footer';
import Intercom from 'components/react-intercom';

import styles from './page.module.scss';

export interface PageProps {
  children: ReactNode;
  formWidth?: boolean;
}

export default function Page({ children, formWidth }: PageProps): JSX.Element {
  return (
    <>
      <div data-cy='page' className={styles.wrapper}>
        {children}
      </div>
      <Footer formWidth={formWidth} />
      <Intercom />
    </>
  );
}

Page.defaultProps = { formtWidth: false };
