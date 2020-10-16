/**
 * Converts a given data model object into a Firestore-valid datatype by
 * removing any "undefined" values.
 * @param obj - The data model to clean.
 * @return The data model without any "undefined" properties.
 */
export default function firestoreVals<T>(obj: T): Partial<T> {
  return Object.fromEntries(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */

    Object.entries(obj).filter(([_, val]) => val !== undefined)
  ) as Partial<T>;
}
