/**
 * Converts a given data model object into a Firestore-valid datatype by
 * removing any empty values.
 * @param obj - The data model to clean.
 * @return The data model without any undefined or empty fields.
 * @todo When calling `DocumentReference#update`, this will prevent fields from
 * being properly cleared. We might want to change this default behavior and
 * include some empty fields.
 */
export default function firestoreVals<T>(obj: T): Partial<T> {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const allDefinedValues = Object.fromEntries(
    Object.entries(obj).filter(([_, val]) => val !== undefined)
  );
  const allFilledValues = Object.fromEntries(
    Object.entries(allDefinedValues).filter(([_, val]) => {
      if (!val) return false;
      if (typeof val === 'object' && !Object.keys(val).length) return false;
      return true;
    })
  );
  return allFilledValues as Partial<T>;
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
