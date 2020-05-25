import React from 'react';
import {
  IntlShape,
  injectIntl,
  defineMessages,
  MessageDescriptor,
} from 'react-intl';
import SubjectSelect from '@tutorbook/subject-select';
import ScheduleInput from '@tutorbook/schedule-input';
import { Availability, FiltersInterface } from '@tutorbook/model';

import firebase from '@tutorbook/firebase';

import styles from './filter.module.scss';

interface FilterProps {
  intl: IntlShape;
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
class Filter extends React.Component<FilterProps> {
  public constructor(props: FilterProps) {
    super(props);
    this.updateSubjects = this.updateSubjects.bind(this);
    this.updateAvailability = this.updateAvailability.bind(this);
  }

  private updateSubjects(subjects: string[]): void {
    firebase.analytics().logEvent('filter_subjects');
    this.props.onChange({
      ...this.props.filters,
      subjects: subjects,
    });
  }

  private updateAvailability(availability: Availability): void {
    firebase.analytics().logEvent('filter_availability');
    this.props.onChange({
      ...this.props.filters,
      availability: availability,
    });
  }

  public render(): JSX.Element {
    const labels: Record<string, MessageDescriptor> = defineMessages({
      subjects: {
        id: 'search.filters.subjects',
        defaultMessage: 'Filter by subjects',
        description: 'Label for the subjects filter field.',
      },
      availability: {
        id: 'search.filters.availability',
        defaultMessage: 'Filter by availability',
        description: 'Label for the availability filter field.',
      },
    });
    return (
      <div className={styles.filterWrapper}>
        <SubjectSelect
          label={this.props.intl.formatMessage(labels.subjects)}
          val={this.props.filters.subjects}
          onChange={this.updateSubjects}
          className={styles.filterField}
          outlined
        />
        <ScheduleInput
          label={this.props.intl.formatMessage(labels.availability)}
          val={this.props.filters.availability}
          onChange={this.updateAvailability}
          className={styles.filterField}
          outlined
        />
      </div>
    );
  }
}

export default injectIntl(Filter);
