import { Tag } from 'lib/model/query/users';

export function toggleTag(prev: Tag[], tag: Tag): Tag[] {
  const tags = Array.from(prev);
  const idx = tags.findIndex((a) => a === tag);
  if (idx < 0) {
    tags.push(tag);
  } else {
    tags.splice(idx, 1);
  }
  return tags;
}
