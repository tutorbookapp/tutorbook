import React from 'react';
import VanillaTilt from 'vanilla-tilt';

import CTALink, { CTALinkProps } from './cta-link';

import styles from './spotlight-msg.module.scss';

interface SpotlightMsgProps {
  gray?: boolean;
  flipped?: boolean;
  headline: string;
  body: string;
  label: string;
  img: string;
  cta: CTALinkProps;
}

export default function SpotlightMsg({
  gray,
  flipped,
  headline,
  body,
  label,
  img,
  cta,
}: SpotlightMsgProps): JSX.Element {
  const imgRef: React.RefObject<HTMLDivElement> = React.useRef(null);
  const colorClass: string = gray ? styles.featureSpotlightGray : '';

  React.useEffect(() => {
    if (imgRef.current) VanillaTilt.init(imgRef.current, { max: 10 });
  }, [imgRef]);

  return (
    <div className={styles.spotlight}>
      <div className={`${styles.featureSpotlight} ${colorClass}`}>
        <div className={styles.featureSpotlightBackground}>
          <div
            className={
              styles.featureSpotlightLead +
              (flipped ? ` ${styles.featureSpotlightLeadFlipped}` : '')
            }
          >
            <div className={styles.featureSpotlightIconWrapper}>
              {/* <img className={styles.featureSpotlightIcon} src={icon} /> */}
              <div className={styles.featureSpotlightIconText}>
                <span>{label}</span>
              </div>
            </div>
            <h2 className={styles.featureSpotlightHeading}>{headline}</h2>
            <div className={styles.featureSpotlightSubheading}>{body}</div>
          </div>
          <div
            className={`${styles.featureSpotlightChildren} ${
              styles.featureSpotlightChildrenZippered
            }${flipped ? ` ${styles.featureSpotlightChildrenFlipped}` : ''}`}
          >
            <div className={styles.featureSpotlightCTA}>
              <CTALink {...cta} />
            </div>
          </div>
          <div
            ref={imgRef}
            style={{ backgroundImage: `url(${img}` }}
            className={
              styles.featureSpotlightMedia +
              (flipped ? ` ${styles.featureSpotlightMediaFlipped}` : '')
            }
          >
            <img
              className={styles.featureSpotlightMediaImg}
              alt={body}
              src={img}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
