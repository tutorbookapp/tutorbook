import React from 'react';

import { IconButton } from '@rmwc/icon-button';

import { v4 as uuid } from 'uuid';

import styles from './carousel.module.scss';

interface CarouselProps {
  readonly title?: string;
  readonly children: JSX.Element[];
}

interface CarouselState {
  readonly scroll: number;
}

export default class Carousel extends React.Component<
  CarouselProps,
  CarouselState
> {
  private readonly scrollerRef: React.RefObject<
    HTMLDivElement
  > = React.createRef();

  private readonly childRef: React.RefObject<
    HTMLDivElement
  > = React.createRef();

  public constructor(props: CarouselProps) {
    super(props);
    this.state = { scroll: 0 };
    this.scrollLeft = this.scrollLeft.bind(this);
    this.scrollRight = this.scrollRight.bind(this);
  }

  private get childWidth(): number {
    return this.childRef.current ? this.childRef.current.clientWidth + 24 : 100;
  }

  private get scrollerWidth(): number {
    if (!this.childRef.current || !this.scrollerRef.current) return Infinity;
    const width: number = this.childRef.current.clientWidth + 24;
    const visible: number = this.scrollerRef.current.clientWidth;
    const { children } = this.props;
    return width * children.length - visible - 48;
  }

  private get atStart(): boolean {
    const { scroll } = this.state;
    return scroll <= 0;
  }

  private get atEnd(): boolean {
    const { scroll } = this.state;
    return scroll >= this.scrollerWidth;
  }

  private scrollLeft(): void {
    if (this.atStart) return;
    this.setState((state: CarouselState) => ({
      scroll: Math.max(Math.floor(state.scroll - this.childWidth), 0),
    }));
  }

  private scrollRight(): void {
    if (this.atEnd) return;
    this.setState((state: CarouselState) => ({
      scroll: Math.min(
        Math.ceil(state.scroll + this.childWidth),
        this.scrollerWidth
      ),
    }));
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
            {children.map((child: JSX.Element) => (
              <div key={uuid()} ref={this.childRef} className={styles.child}>
                {child}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
}
