import React from 'react';
import { Availability, TimeslotJSONInterface } from './times';

export type Aspect = 'mentoring' | 'tutoring';

export interface Query {
  subjects: string[];
  availability: Availability;
  aspect: Aspect;
}

export interface QueryJSONInterface {
  subjects: string[];
  availability: TimeslotJSONInterface[];
  aspect: Aspect;
}

export const QueryContext: React.Context<Query> = React.createContext({
  subjects: [],
  availability: new Availability(),
  aspect: 'mentoring',
} as Query);
