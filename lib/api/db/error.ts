import { PostgrestError } from '@supabase/supabase-js';

import { APIError } from 'lib/model/error';

export default function handle(
  action: string,
  noun: string,
  obj: { toString: () => string },
  err: PostgrestError | null
): void {
  if (!err) return;
  const msg = `Error ${action} ${noun} (${obj.toString()}) in database`;
  throw new APIError(`${msg}: ${err.message || err.hint || err.details}`, 500);
}
