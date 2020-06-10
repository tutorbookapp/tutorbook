import React from 'react';

import firebase from './base';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentReference = firebase.firestore.DocumentReference;

export const DBContext: React.Context<DocumentReference> = React.createContext(
  firebase.firestore().collection('partitions').doc('default')
);

export const useDB: () => DocumentReference = () => React.useContext(DBContext);

export function DBProvider({
  children,
}: {
  children: JSX.Element[] | JSX.Element;
}): JSX.Element {
  const db: DocumentReference =
    process.env.NODE_ENV === 'development'
      ? firebase.firestore().collection('partitions').doc('test')
      : firebase.firestore().collection('partitions').doc('default');
  return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}
