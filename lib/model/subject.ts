import { isJSON } from 'lib/model/json';

export interface Subject {
  id: number;
  name: string;
}

export function isSubject(subject: unknown): subject is Subject {
  return isJSON(subject) && typeof subject.id === 'number' && typeof subject.name === 'string';
}
