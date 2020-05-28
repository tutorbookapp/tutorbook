import React from 'react';

import { IScrollOptions, ScrollTo, ScrollArea } from 'react-scroll-to';
import { IconButton } from '@rmwc/icon-button';

import styles from './carousel.module.scss';

interface CarouselProps {
  readonly title?: string;
  readonly children: JSX.Element[];
}

interface CarouselState {
  readonly scroll: number;
}

export default class Carousel extends React.Component<CarouselProps> {
  public readonly state: CarouselState = { scroll: 0 };

  private readonly scrollerRef: React.RefObject<
    HTMLDivElement
  > = React.createRef();

  private readonly childRef: React.RefObject<
    HTMLDivElement
  > = React.createRef();

  public constructor(props: CarouselProps) {
    super(props);
    this.scrollLeft = this.scrollLeft.bind(this);
    this.scrollRight = this.scrollRight.bind(this);
  }

  private scrollLeft(): void {
    if (this.atStart) return;
    const width: number = (this.childRef.current || {}).clientWidth + 24 || 100;
    this.setState({ scroll: Math.floor(this.state.scroll - width) });
  }

  private scrollRight(): void {
    if (this.atEnd) return;
    const width: number = (this.childRef.current || {}).clientWidth + 24 || 100;
    this.setState({ scroll: Math.ceil(this.state.scroll + width) });
  }

  private get atStart(): boolean {
    return this.state.scroll <= 0;
  }

  private get atEnd(): boolean {
    const width: number = (this.childRef.current || {}).clientWidth + 24;
    const visible: number = (this.scrollerRef.current || {}).clientWidth;
    return (
      this.state.scroll >= width * this.props.children.length - visible - 48
    );
  }

  public render(): JSX.Element {
    const { title, children } = this.props;
    const { scroll } = this.state;
    const hidden: Record<string, string> = { display: 'none' };
    return (
      <>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div className={styles.wrapper}>
          <IconButton
            style={this.atStart ? hidden : {}}
            onClick={this.scrollLeft}
            className={styles.left}
            icon='chevron_left'
          />
          <IconButton
            style={this.atEnd ? hidden : {}}
            onClick={this.scrollRight}
            className={styles.right}
            icon='chevron_right'
          />
          <div
            className={styles.scroller}
            style={{ right: scroll }}
            ref={this.scrollerRef}
          >
            {children.map((child: JSX.Element, index: number) => (
              <div ref={this.childRef} className={styles.child}>
                {child}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
}
