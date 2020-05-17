import styles from './spotlight-msg.module.scss';

interface SpotlightMsgProps {
  readonly coral?: boolean;
  readonly tan?: boolean;
  readonly teal?: boolean;
  readonly yellow?: boolean;
  readonly flipped?: boolean;
  readonly headline: string;
  readonly body: string;
  readonly label: string;
  readonly img: string;
}

export default function SpotlightMsg(props: SpotlightMsgProps): JSX.Element {
  return (
    <div className={styles.spotlight}>
      <div
        className={
          styles.featureSpotlight +
          (props.coral
            ? ' ' + styles.featureSpotlightCoral
            : props.tan
            ? ' ' + styles.featureSpotlightTan
            : props.teal
            ? ' ' + styles.featureSpotlightTeal
            : props.yellow
            ? ' ' + styles.featureSpotlightYellow
            : '')
        }
      >
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
          ></div>
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
