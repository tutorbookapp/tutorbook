// TODO: Add more type assertions here to ensure that the `Record` is actually
// JSON compliant (e.g. doesn't contain any `undefined` values or `Function`s).
export default function isJSON(json: unknown): json is Record<string, unknown> {
  return typeof json === 'object' && json !== null;
}
