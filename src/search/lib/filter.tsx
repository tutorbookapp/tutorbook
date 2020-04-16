import React from 'react';
import { FiltersInterface } from '@tutorbook/model';

import styles from './filter.module.scss';

interface FilterProps {
  filters: FiltersInterface;
  onChange: (filters: FiltersInterface) => any;
}

interface FilterState {
  filters: FiltersInterface;
}

/**
 * Class that represents the filter side bar in the search view that enables the
 * user to refine and modify their original search (the original search is just
 * whatever they fill out in their profile right now).
 */
export default class Filter extends React.Component<FilterProps> {
  public readonly state: FilterState;

  public constructor(props: FilterProps) {
    super(props);
    this.state = {
      filters: props.filters,
    };
  }

  public render(): JSX.Element {
    return <div className={styles.filterWrapper} />;
  }
}
