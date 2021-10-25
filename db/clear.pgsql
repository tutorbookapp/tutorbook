create or replace function clear()
returns void as
$$
  delete from orgs;
  delete from users;
  delete from meetings;
$$
language sql volatile;
