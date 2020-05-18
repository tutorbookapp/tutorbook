import React from 'react';

import CTALink, { CTALinkProps } from './cta-link';

import styles from './spotlight-msg.module.scss';

interface SpotlightMsgProps {
  coral?: boolean;
  tan?: boolean;
  teal?: boolean;
  yellow?: boolean;
  flipped?: boolean;
  headline: string;
  body: string;
  label: string;
  img: string;
  cta: CTALinkProps;
}

export default function SpotlightMsg(props: SpotlightMsgProps): JSX.Element {
  const colorClass: string = props.coral
    ? styles.featureSpotlightCoral
    : props.tan
    ? styles.featureSpotlightTan
    : props.teal
    ? styles.featureSpotlightTeal
    : props.yellow
    ? styles.featureSpotlightYellow
    : '';
  return (
    <div className={styles.spotlight}>
      <div className={styles.featureSpotlight + ' ' + colorClass}>
        <div className={styles.featureSpotlightBackground}>
          <div
            className={
              styles.featureSpotlightLead +
              (props.flipped ? ' ' + styles.featureSpotlightLeadFlipped : '')
            }
          >
            <div className={styles.featureSpotlightIconWrapper}>
              {/* <img className={styles.featureSpotlightIcon} src={props.icon} /> */}
              <div className={styles.featureSpotlightIconText}>
                <span>{props.label}</span>
              </div>
            </div>
            <h2 className={styles.featureSpotlightHeading}>{props.headline}</h2>
            <div className={styles.featureSpotlightSubheading}>
              {props.body}
            </div>
          </div>
          <div
            className={
              styles.featureSpotlightChildren +
              ' ' +
              styles.featureSpotlightChildrenZippered +
              (props.flipped
                ? ' ' + styles.featureSpotlightChildrenFlipped
                : '')
            }
          >
            <div className={styles.featureSpotlightCTA}>
              <CTALink black {...props.cta} />
            </div>
          </div>
          <div
            style={{ backgroundImage: `url(${props.img}` }}
            className={
              styles.featureSpotlightMedia +
              (props.flipped ? ' ' + styles.featureSpotlightMediaFlipped : '')
            }
          >
            <img className={styles.featureSpotlightMediaImg} src={props.img} />
          </div>
        </div>
      </div>
    </div>
  );
}
