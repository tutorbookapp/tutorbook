import { FirebaseError } from 'firebase-admin';

export type ApiError = Partial<Error & FirebaseError> & { msg: string };

export interface ApiCallResult {
  code?: number;
  msg: string;
}
