/**
 * An `Account` object is the base object that is extended by the `Org` and
 * `User` objects. That way, we can have one `AccountProvider` for both orgs and
 * users.
 */
export interface Account {
  id: string;
  name: string;
  photo: string;
  email: string;
  phone: string;
  bio: string;
}
