-- Users with meetings per week (and growth rate and total for time range).
drop function if exists users_with_meetings;
create or replace function users_with_meetings(org_id text, time_zone text)
returns table (week timestamptz, users bigint, growth float)
as $$
  select 
    week, 
    users, 
    (users::float /  lag(users) over (order by week) - 1) growth
  from (
    select 
      date_trunc('week', meeting_instances.instance_time, time_zone) as week,
      count(distinct(relation_people.user)) as users
    from
      relation_people
      inner join meeting_instances on meeting_instances.id = relation_people.meeting
    where 
      meeting_instances.instance_time >= date_trunc('week', current_date, time_zone) - interval '50 weeks'
      and meeting_instances.instance_time <= date_trunc('week', current_date, time_zone) + interval '5 week' 
      and meeting_instances.org = org_id
    group by week
  ) as _;
$$
language sql stable;

-- Users (and growth rate and total).
drop function if exists users;
create or replace function users(org_id text, time_zone text)
returns table (week timestamptz, users bigint, growth float, total numeric, total_growth float)
as $$
  select *, (total::float / lag(total) over (order by week) - 1) total_growth 
  from (
    select 
      week,
      users,
      (users::float / lag(users) over (order by week) - 1) growth,
      (sum(users) over (order by week)) total
    from (
      select
        date_trunc('week', users.created, time_zone) as week,
        count(distinct(users.id)) as users
      from 
        users
        inner join relation_orgs on relation_orgs.user = users.id
      where
        relation_orgs.org = org_id
      group by week
    ) as _
  ) as _;
$$
language sql stable;

-- Meetings per week (and growth rate and total for time range).
-- TODO: Support more time range (e.g. day, month, year).
-- TODO: Start week off on Sundays instead of Mondays (to be consistent with the
-- calendar and the availability select).
drop function if exists meetings;
create or replace function meetings(org_id text, time_zone text)
returns table (week timestamptz, meetings bigint, growth float, total numeric)
as $$
  select 
    week, 
    meetings, 
    (meetings::float /  lag(meetings) over (order by week) - 1) growth,
    (sum(meetings) over (order by week)) total
  from (
    select 
      date_trunc('week', meeting_instances.instance_time, time_zone) as week,
      count(meeting_instances) as meetings
    from
      meeting_instances
    where 
      meeting_instances.instance_time >= date_trunc('week', current_date, time_zone) - interval '50 weeks'
      and meeting_instances.instance_time <= date_trunc('week', current_date, time_zone) + interval '5 week' 
      and meeting_instances.org = org_id
    group by week
  ) as _;
$$
language sql stable;

-- Service hours per week (and growth rate and total for time range).
drop function if exists service_hours;
create or replace function service_hours(org_id text, time_zone text)
returns table (week timestamptz, hours float, growth float, total float)
as $$
  select 
    week, 
    hours, 
    (hours::float /  lag(hours) over (order by week) - 1) growth,
    (sum(hours) over (order by week)) total
  from (
    select 
      date_trunc('week', meeting_instances.instance_time, time_zone) as week,
      sum(extract(epoch from ((meeting_instances.time).to - (meeting_instances.time).from)) / 60 / 60) as hours
    from
      meeting_instances
    where 
      meeting_instances.instance_time >= date_trunc('week', current_date, time_zone) - interval '50 weeks'
      and meeting_instances.instance_time <= date_trunc('week', current_date, time_zone) + interval '5 week' 
      and meeting_instances.org = org_id
    group by week
  ) as _;
$$
language sql stable;
