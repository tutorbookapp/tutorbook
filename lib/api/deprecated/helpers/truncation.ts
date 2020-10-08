/**
 * For privacy reasons, we only add the user's first name and last initial to
 * our Algolia search index (and thus we **never** share the user's full name).
 * @example
 * assert(onlyFirstNameAndLastInitial('Nicholas Chiang') === 'Nicholas C.');
 * @todo Avoid code duplication from `algoliaUserUpdate` Firebase Function.
 */
export function onlyFirstNameAndLastInitial(name: string): string {
  const split: string[] = name.trim().split(' ');
  if (split.length === 1) return split[0];
  return `${split[0]} ${split[split.length - 1][0]}.`;
}
