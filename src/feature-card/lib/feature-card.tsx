import React from 'react';
import { Card, CardPrimaryAction, CardMedia } from '@rmwc/card';
import { Typography } from '@rmwc/typography';
import { Link } from '@tutorbook/intl';

import styles from './feature-card.module.scss';

interface FeatureCardProps {
  readonly header: string;
  readonly body: string;
  readonly href: string;
  readonly img: string;
}

export default function FeatureCard(props: FeatureCardProps): JSX.Element {
  return (
    <Card className={styles.card}>
      <Link href={props.href}>
        <CardPrimaryAction>
          <CardMedia
            sixteenByNine
            style={{ backgroundImage: `url(${props.img})` }}
          />
          <div className={styles.cardContent}>
            <Typography use='headline6'>{props.header}</Typography>
            <Typography use='body1'>{props.body}</Typography>
          </div>
        </CardPrimaryAction>
      </Link>
    </Card>
  );
}
