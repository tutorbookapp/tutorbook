import React from 'react';

import styles from './banner.module.scss';

interface BannerState {
  height: number;
}

interface BannerProps {
  children: JSX.Element | JSX.Element[];
}

export default class Banner extends React.Component<BannerProps> {
  public readonly state: BannerState = {
    height: 300,
  };
  private content: React.RefObject<HTMLDivElement> = React.createRef();

  // TODO: Do we want to update `onComponentDidUpdate` as well?
  public componentDidMount(): void {
    if (this.content.current) {
      const height: number = this.content.current.clientHeight;
      if (height !== this.state.height) this.setState({ height });
    }
  }

  public render(): JSX.Element {
    return (
      <div className={styles.bannerWrapper}>
        <div
          className={styles.bannerBackground}
          style={{
            height: this.state.height,
          }}
        />
        <div className={styles.banner} ref={this.content}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
