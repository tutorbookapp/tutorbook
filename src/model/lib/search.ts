import { Availability, TimeslotJSONInterface } from './times';

export interface FiltersInterface {
  subjects: string[];
  availability: Availability;
}

export interface FiltersJSONInterface {
  subjects: string[];
  availability: TimeslotJSONInterface[];
}
