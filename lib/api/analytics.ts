import { Analytics, TagTotals } from 'lib/model/analytics';
import { Match, MatchTag } from 'lib/model/match';
import { Meeting, MeetingTag } from 'lib/model/meeting';
import { Role, isRole } from 'lib/model/person';
import { User, UserTag } from 'lib/model/user';
import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

async function getMostRecentAnalytics(orgId: string): Promise<Analytics> {
  const snapshot = await db
    .collection('orgs')
    .doc(orgId)
    .collection('analytics')
    .orderBy('created', 'desc')
    .limit(1)
    .get();
  return snapshot.docs[0]
    ? Analytics.fromFirestoreDoc(snapshot.docs[0])
    : new Analytics();
}

function updateTags<T extends UserTag | MatchTag | MeetingTag>(
  key: Role | 'match' | 'meeting',
  action: 'created' | 'updated' | 'deleted',
  nums: Analytics,
  currentTags: T[],
  originalTags?: T[]
): void {
  // TODO: Get rid of this weird type cast. We should be able to assign to
  // `nums[key][tag]` directly (`nums[key]` should be of type `TagTotals<T>`).
  const totals = (nums[key] as unknown) as TagTotals<string>;
  if (action === 'created') totals.total += 1;
  if (action === 'deleted') totals.total -= 1;
  currentTags.forEach((tag) => {
    if (isRole(tag)) return;
    if (action === 'created') totals[tag] += 1;
    if (action === 'updated' && originalTags && !originalTags.includes(tag))
      totals[tag] += 1;
    if (action === 'deleted') totals[tag] -= 1;
  });
  if (action === 'updated' && originalTags)
    originalTags.forEach((tag) => {
      if (!currentTags.includes(tag)) totals[tag] -= 1;
    });
  if (action === 'updated' && !originalTags)
    throw new APIError('Analytics missing original resource data.', 500);
}

async function updateAnalyticsDoc(
  orgId: string,
  nums: Analytics
): Promise<void> {
  nums.updated = new Date();
  if (nums.id && nums.created.valueOf() >= nums.updated.valueOf() - 864e5) {
    // If the doc create time is within 24 hours, update it.
    await db
      .collection('orgs')
      .doc(orgId)
      .collection('analytics')
      .doc(nums.id)
      .set(nums.toFirestore());
  } else {
    // Otherwise, create a new analytics doc.
    const ref = db.collection('orgs').doc(orgId).collection('analytics').doc();
    nums.created = nums.updated;
    nums.id = ref.id;
    await ref.set(nums.toFirestore());
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
  resource: T,
  action: 'created' | 'updated' | 'deleted',
  original?: T
): Promise<void> {
  if (resource instanceof User) {
    await Promise.all(
      resource.orgs.map(async (org) => {
        const nums = await getMostRecentAnalytics(org);
        resource.tags.forEach((role) => {
          if (isRole(role))
            updateTags(
              role,
              action,
              nums,
              resource.tags,
              original?.tags as UserTag[]
            );
        });
        await updateAnalyticsDoc(org, nums);
      })
    );
  } else if (resource instanceof Match) {
    const nums = await getMostRecentAnalytics(resource.org);
    updateTags(
      'match',
      action,
      nums,
      resource.tags,
      original?.tags as MatchTag[]
    );
    await updateAnalyticsDoc(resource.org, nums);
  } else if (resource instanceof Meeting) {
    const nums = await getMostRecentAnalytics(resource.match.org);
    updateTags(
      'meeting',
      action,
      nums,
      resource.tags,
      original?.tags as MeetingTag[]
    );
    await updateAnalyticsDoc(resource.match.org, nums);
  } else {
    throw new APIError('Analytics resource not a user/match/meeting.', 500);
  }
}
