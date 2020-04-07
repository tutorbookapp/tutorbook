import MobileNav from './mobile'
import DesktopNav from './desktop'

import styles from './covid-header.module.scss'

interface HeaderProps {
  white?: boolean;
  sticky?: boolean;
  className?: string;
}

function Header(props: HeaderProps) {
  const { white, sticky, className } = props;
  return (
    <header
      style={{
        position: sticky ? 'sticky' : 'initial',
      }}
      className={styles.header + ' ' +
        (white ? styles.whiteHeader : styles.blackHeader) + 
        (className ? ' ' + className : '')
      }
    >
      <MobileNav white={!!white} />
      <DesktopNav white={!!white} />
    </header>
  );
};

export default Header
