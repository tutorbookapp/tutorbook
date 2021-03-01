// TODO: Verify that the values at each key in `body.options` matches the
// required data type in `T`. Only use values that are valid.
export default function verifyOptions<T>(body: unknown, fallback: T): T {
  return { ...fallback, ...(body as { options: T }).options };
}
