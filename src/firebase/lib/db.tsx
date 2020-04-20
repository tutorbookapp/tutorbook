// TODO: Only initialize on client-side (no server-side authentication).

import React from 'react';

import { DocumentReference } from '@firebase/firestore-types';
import firebase from './base';

export const DBContext: React.Context<DocumentReference> = React.createContext(
  firebase.firestore().collection('partitions').doc('default')
);

export const useDB = () => React.useContext(DBContext);

export function DBProvider({
  children,
}: {
  children: JSX.Element[] | JSX.Element;
}) {
  const db: DocumentReference =
    process.env.NODE_ENV === 'development'
      ? firebase.firestore().collection('partitions').doc('test')
      : firebase.firestore().collection('partitions').doc('default');
  return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}
