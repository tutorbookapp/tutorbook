drop view if exists hours_cumulative;
create or replace view hours_cumulative as
select
  sum(hours) over (partition by (_.user, _.org) order by (_.instance_time)) as total,
  *
from (
  select
    extract(epoch from ((meeting_instances.time).to - (meeting_instances.time).from)) / 60 / 60 as hours,
    meeting_instances.*,
    relation_people.*
  from
    meeting_instances
  inner join
    relation_people on meeting_instances.id = relation_people.meeting
  where
    meeting_instances.instance_time <= current_date
) as _;

drop view if exists hours_total;
create or replace view hours_total as
select
  relation_people.user,
  meeting_instances.org,
  sum(extract(epoch from ((meeting_instances.time).to - (meeting_instances.time).from)) / 60 / 60) as hours 
from 
  meeting_instances
inner join
  relation_people on meeting_instances.id = relation_people.meeting
where
  meeting_instances.instance_time <= current_date
group by
  relation_people.user,
  meeting_instances.org;
