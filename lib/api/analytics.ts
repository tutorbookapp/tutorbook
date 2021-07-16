import { Analytics, TagTotals } from 'lib/model/analytics';
import { Match, MatchTag } from 'lib/model/match';
import { Meeting, MeetingTag } from 'lib/model/meeting';
import { User, UserTag } from 'lib/model/user';
import { APIError } from 'lib/api/error';
import { Role } from 'lib/model/person';
import { db } from 'lib/api/firebase';

export type Action = 'created' | 'updated' | 'deleted';

async function getMostRecentAnalytics(orgId: string): Promise<Analytics> {
  const snapshot = await db
    .collection('orgs')
    .doc(orgId)
    .collection('analytics')
    .orderBy('date', 'desc')
    .limit(1)
    .get();
  return Analytics.parse(snapshot.docs[0] ? snapshot.docs[0].data() : {});
}

function updateTags<T extends UserTag | MatchTag | MeetingTag>(
  key: Role | 'match' | 'meeting',
  action: Action,
  nums: Analytics,
  currentTags: T[],
  originalTags?: T[]
): void {
  // TODO: Get rid of this weird type cast. We should be able to assign to
  // `nums[key][tag]` directly (`nums[key]` should be of type `TagTotals<T>`).
  const totals = (nums[key] as unknown) as TagTotals;

  // If resource was created (or added to org), increment totals.
  if (action === 'created') totals.total += 1;

  // If resource was deleted (or removed from org), decrement totals.
  if (action === 'deleted') totals.total -= 1;
  currentTags.forEach((tag) => {
    if (Role.safeParse(tag).success) return;

    // If resource was created (or added to org), increment totals.
    if (action === 'created') totals[tag] += 1;

    // If resource was updated and tag was added, increment totals.
    if (action === 'updated' && originalTags && !originalTags.includes(tag))
      totals[tag] += 1;

    // If resource was deleted (or removed from org), decrement totals.
    if (action === 'deleted') totals[tag] -= 1;
  });

  // If resource was updated and tag removed, decrement totals.
  if (action === 'updated' && originalTags)
    originalTags.forEach((tag) => {
      if (!currentTags.includes(tag)) totals[tag] -= 1;
    });

  // If resource was updated, we must know its original tags to properly
  // increment/decrement org analytics totals.
  if (action === 'updated' && !originalTags)
    throw new APIError('Analytics missing original resource data.', 500);
}

async function saveAnalytics(orgId: string, nums: Analytics): Promise<void> {
  const now = new Date();
  if (nums.id && nums.date.valueOf() >= now.valueOf() - 864e5) {
    // If the doc create time is within 24 hours, update it.
    await db
      .collection('orgs')
      .doc(orgId)
      .collection('analytics')
      .doc(nums.id)
      .set(nums);
  } else {
    // Otherwise, create a new analytics doc.
    const ref = db.collection('orgs').doc(orgId).collection('analytics').doc();
    nums.date = now;
    nums.id = ref.id;
    await ref.set(nums);
  }
}

/**
 * Updates our analytics totals.
 * 1. Determines org(s) that resource belongs to.
 * 2. Fetches the most recent analytics doc for those org(s).
 * 3. If the doc create time is within 24 hours, update it. Otherwise, create a
 *    new analytics doc.
 * @see {@link https://github.com/tutorbookapp/tutorbook#analytics}
 */
export default async function analytics<T extends User | Match | Meeting>(
  current: T,
  action: Action,
  original: T = current
): Promise<void> {
  if (User.safeParse(current).success && User.safeParse(original).success) {
    const orig = User.parse(original);
    const curr = User.parse(current);
    // If an update removes orgs, we want to decrement those orgs' statistics
    // based on the orig's tags.
    const removedFromOrgs = orig.orgs.filter(
      (o) => !curr.orgs.includes(o)
    );
    const removedPromises = removedFromOrgs.map(async (orgId) => {
      const nums = await getMostRecentAnalytics(orgId);
      orig.tags.filter((r) => Role.safeParse(r).success).forEach((role) => {
        updateTags(Role.parse(role), 'deleted', nums, orig.tags);
      });
      await saveAnalytics(orgId, nums);
    });

    // If an update adds orgs, we want to increment those orgs' statistics
    // based on the curr tags.
    const addedToOrgs = curr.orgs.filter((o) => !orig.orgs.includes(o));
    const addedPromises = addedToOrgs.map(async (orgId) => {
      const nums = await getMostRecentAnalytics(orgId);
      curr.tags.filter((r) => Role.safeParse(r).success).forEach((role) => {
        updateTags(Role.parse(role), 'created', nums, curr.tags);
      });
      await saveAnalytics(orgId, nums);
    });

    // If an org was already there, we change those org's statistics based on
    // the change between the orig and curr tags.
    const existingOrgs = curr.orgs.filter((o) => orig.orgs.includes(o));
    const existingPromises = existingOrgs.map(async (orgId) => {
      const nums = await getMostRecentAnalytics(orgId);
      curr.tags.filter((r) => Role.safeParse(r).success).forEach((role) => {
        updateTags(Role.parse(role), action, nums, curr.tags, orig.tags);
      });
      await saveAnalytics(orgId, nums);
    });

    await Promise.all([
      ...existingPromises,
      ...removedPromises,
      ...addedPromises,
    ]);
  } else if (Match.safeParse(current).success && Match.safeParse(original).success) {
    const orig = Match.parse(original);
    const curr = Match.parse(current);
    // TODO: Add edge cases when the orgs on a resource changes.
    const nums = await getMostRecentAnalytics(curr.org);
    updateTags('match', action, nums, curr.tags, orig.tags);
    await saveAnalytics(curr.org, nums);
  } else if (Meeting.safeParse(current).success && Meeting.safeParse(original).success) {
    const orig = Meeting.parse(original);
    const curr = Meeting.parse(current);
    // TODO: Add edge cases when the orgs on a resource changes.
    const nums = await getMostRecentAnalytics(curr.match.org);
    updateTags('meeting', action, nums, curr.tags, orig.tags);
    await saveAnalytics(curr.match.org, nums);
  } else {
    throw new APIError('Analytics resource not a user/match/meeting.', 500);
  }
}
