drop function if exists hours;
create or replace function hours(org_id text, user_id text) 
returns table (hours bigint)
as $$
  select sum(extract(epoch from ((time).to - (time).from)) / 60 / 60) as hours from (
    select distinct on (meeting_instances.id) meeting_instances.time
    from meeting_instances
    inner join relation_people on meeting_instances.id = relation_people.meeting
    where relation_people.user = user_id and meeting_instances.org = org_id 
  ) as _;
$$
language sql stable;
