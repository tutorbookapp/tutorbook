import Title from 'components/title';

import styles from './hero-title.module.scss';

export interface HeroTitleProps {
  header: string;
  body: string;
}

export default function HeroTitle({
  header,
  body,
}: HeroTitleProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <Title>{header}</Title>
        <h3>{body}</h3>
      </div>
    </div>
  );
}
