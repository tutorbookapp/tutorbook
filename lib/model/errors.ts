import { FirebaseError } from 'firebase-admin';

export type ApiError = Partial<Error & FirebaseError> & { msg: string };
