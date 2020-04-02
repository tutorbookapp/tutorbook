import styles from './index.module.scss'

interface SecondaryLinkProps { href: string; label: string; }

function SecondaryLink(props: SecondaryLinkProps) {
  return (
    <li className={styles.secondaryLinkItem}>
      <a href={props.href} className={styles.secondaryLink}>{props.label}</a>
    </li>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.sitemapTitle}>
        <h1 id="sitemap">Sitemap</h1>
      </span>
      <nav className={styles.contentWrapper} aria-labelledby="sitemap">
        <ul className={styles.secondaryLinks}>
          <SecondaryLink 
            href="https://tutorbook.app/legal/#terms"
            label="Terms" />
          <SecondaryLink
            href="https://tutorbook.app/legal/#privacy"
            label="Privacy" />
          <SecondaryLink
            href="https://tutorbook.app/legal/#security"
            label="Security" />
        </ul>
      </nav>
    </footer>
  );
}

export default Footer
