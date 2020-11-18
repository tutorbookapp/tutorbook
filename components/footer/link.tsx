import NextLink from 'next/link';

import styles from './link.module.scss';

export interface LinkProps {
  href: string;
  children: string;
}

export default function Link({ href, children }: LinkProps): JSX.Element {
  return (
    <li className={styles.link}>
      <NextLink href={href}>
        <a>{children}</a>
      </NextLink>
    </li>
  );
}
