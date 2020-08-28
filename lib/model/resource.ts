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
