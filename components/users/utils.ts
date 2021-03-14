import { UserHitTag } from 'lib/model/user';

export function toggleTag(prev: UserHitTag[], tag: UserHitTag): UserHitTag[] {
  const tags = Array.from(prev);
  const idx = tags.findIndex((a) => a === tag);
  if (idx < 0) {
    tags.push(tag);
  } else {
    tags.splice(idx, 1);
  }
  return tags;
}
