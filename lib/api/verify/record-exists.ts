import { APIError } from 'lib/api/error';
import supabase from 'lib/api/supabase';

export default async function verifyRecordExists<T extends { id: unknown }>(
  table: string,
  id: T['id']
): Promise<T> {
  const { data, error } = await supabase.from<T>(table).select().eq('id', id);
  if (error || !data?.length) {
    const msg = `Record (${table}/${id as string}) does not exist in database`;
    throw new APIError(error ? `${msg}: ${error.message}` : msg, 400);
  }
  return data[0];
}
