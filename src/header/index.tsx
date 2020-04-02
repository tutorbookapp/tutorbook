import MobileNav from './mobile'
import DesktopNav from './desktop'

import styles from './index.module.scss'

function Header() {
  return (
    <header className={styles.header}>
      <MobileNav />
      <DesktopNav />
    </header>
  );
};

export default Header
