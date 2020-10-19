import { isDateJSON, isJSON } from 'lib/model/json';

/**
 * The base interface for all of our data models.
 * @typedef {Object} Resource
 * @property created - When the resource was first created.
 * @property updated - The last time the resource was updated.
 */
export interface Resource {
  created: Date;
  updated: Date;
}

export function isResourceJSON(json: unknown): json is Resource {
  if (!isJSON(json)) return false;
  if (!isDateJSON(json.created)) return false;
  if (!isDateJSON(json.updated)) return false;
  return true;
}
