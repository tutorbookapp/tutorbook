/**
 * Workaround because of the way that Next.js checks for JSON serializability.
 * @see {@link https://github.com/vercel/next.js/issues/13209}
 */
export default function json<Model, ModelJSON>(input: Model): ModelJSON {
  return JSON.parse(JSON.stringify(input)) as ModelJSON;
}
