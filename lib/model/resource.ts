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

export interface ResourceJSON {
  created: string;
  updated: string;
}

export function isResourceJSON(json: unknown): json is ResourceJSON {
  if (!isJSON(json)) return false;
  if (!isDateJSON(json.created)) return false;
  if (!isDateJSON(json.updated)) return false;
  return true;
}

// TODO: Implement a class that has `toJSON` and `fromJSON` methods instead of
// these helper functions.
export function resourceToJSON(resource: Resource): ResourceJSON {
  return {
    created: resource.created.toJSON(),
    updated: resource.updated.toJSON(),
  };
}

export function resourceFromJSON(json: ResourceJSON): Resource {
  return {
    created: new Date(json.created),
    updated: new Date(json.updated),
  };
}
