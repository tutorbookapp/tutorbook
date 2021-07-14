import { z } from 'zod';

import { Resource } from 'lib/model/resource';

/**
 * @typedef {Object} TagTotals
 * @description We collect totals based on data model tags. Because they're
 * filterable tags, org admins can then filter and see what's in these totals.
 */
export const TagTotals = z.object({ total: z.number() }).and(z.record(z.number()));
export type TagTotals = z.infer<typeof TagTotals>;

/**
 * @typedef {Object} Analytics
 * @extends Resource
 * @description A day of org analytics. Created when the first even triggers and
 * is updated until 24 hours have passed (and a new analytics doc is created).
 */
export const Analytics = Resource.extend({
  tutor: TagTotals.default({
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  }),
  tutee: TagTotals.default({
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  }),
  mentor: TagTotals.default({
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  }),
  mentee: TagTotals.default({
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  }),
  parent: TagTotals.default({
    total: 0,
    vetted: 0,
    matched: 0,
    meeting: 0,
  }),
  match: TagTotals.default({
    total: 0,
    meeting: 0,
  }),
  meeting: TagTotals.default({
    total: 0,
    recurring: 0,
  }),
  date: z.date(),
  id: z.string(),
});
export type Analytics = z.infer<typeof Analytics>;
