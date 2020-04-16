import React from 'react';
import { FiltersInterface } from '@tutorbook/model';

import styles from './results.module.scss';

interface SearchResultsProps {
  filters: FiltersInterface;
}

export default class SearchResults extends React.Component<SearchResultsProps> {
  public render(): JSX.Element {
    return <div className={styles.resultsWrapper}></div>;
  }
}
