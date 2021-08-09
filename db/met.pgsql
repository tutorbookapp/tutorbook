-- FUNCTIONS
-- Function to get all the users that a person has meetings with. Note that
-- this includes the user itself (e.g. so a user can book a meeting with
-- themselves; a pretty common use-case when testing the app).
create or replace function met(user_id text, user_role text)
returns table (like view_users)
as $$
  select distinct on (view_users.id) view_users.*
  from relation_people relation_people1
  join relation_people relation_people2
  on relation_people1.meeting = relation_people2.meeting
  join view_users
  on relation_people2.user = view_users.id
  where 
    user_id = relation_people1.user and
    user_role::role = any (relation_people2.roles);
$$
language sql stable;
