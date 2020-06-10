import { Availability, TimeslotJSONInterface } from './times';

export type Aspect = 'mentoring' | 'tutoring';

export interface Query {
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  aspect: Aspect;
}

export interface QueryJSONInterface {
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: TimeslotJSONInterface[];
  aspect: Aspect;
}

export interface Option<T> {
  label: string;
  value: T;
}

export type Callback<T> = (value: T) => void;
