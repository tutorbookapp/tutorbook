import React from 'react';
import SubjectSelect from '@tutorbook/subject-select';
import ScheduleInput from '@tutorbook/schedule-input';
import { Availability, FiltersInterface } from '@tutorbook/model';

import styles from './filter.module.scss';

interface FilterProps {
  filters: FiltersInterface;
  onChange: (filters: FiltersInterface) => any;
}

/**
 * Class that represents the filter side bar in the search view that enables the
 * user to refine and modify their original search (the original search is just
 * whatever they fill out in their profile right now). Controls:
 * - (SubjectSelect) The subjects to search for.
 * - (ScheduleInput) The availability to search for.
 */
export default class Filter extends React.Component<FilterProps> {
  public constructor(props: FilterProps) {
    super(props);
    this.updateSubjects = this.updateSubjects.bind(this);
    this.updateAvailability = this.updateAvailability.bind(this);
  }

  private updateSubjects(subjects: string[]): void {
    console.log('[DEBUG] Subjects were updated:', subjects);
    this.props.onChange({
      ...this.props.filters,
      subjects: subjects,
    });
  }

  private updateAvailability(availability: Availability): void {
    console.log('[DEBUG] Availability was updated:', availability);
    this.props.onChange({
      ...this.props.filters,
      availability: availability,
    });
  }

  public render(): JSX.Element {
    return (
      <div className={styles.filterWrapper}>
        <SubjectSelect
          label='Filter by subjects'
          val={this.props.filters.subjects}
          onChange={this.updateSubjects}
          className={styles.filterField}
          outlined
        />
        <ScheduleInput
          label='Filter by availability'
          val={this.props.filters.availability}
          onChange={this.updateAvailability}
          className={styles.filterField}
          outlined
        />
      </div>
    );
  }
}
