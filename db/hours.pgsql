drop view if exists hours_cumulative;
create or replace view hours_cumulative as
select
  sum(hours) over (partition by (_.user, _.org) order by (_.instance_time)) as total,
  *
from (
  select
    extract(epoch from ((meeting_instances_ppl.time).to - (meeting_instances_ppl.time).from)) / 60 / 60 as hours,
    meeting_instances_ppl.*,
    relation_people.user
  from (
    select meeting_instances.*, people from meeting_instances left outer join (
      select meeting, json_agg(person.*) as people
      from (
        select meeting,roles,users.* 
        from relation_people 
        inner join users on relation_people.user = users.id
      ) as person group by meeting
    ) as people on meeting = meeting_instances.id
  ) as meeting_instances_ppl 
  inner join
    relation_people on meeting_instances_ppl.id = relation_people.meeting
  where
    meeting_instances_ppl.instance_time <= current_date
) as _;

drop view if exists hours_total;
create or replace view hours_total as
select
  sum(extract(epoch from ((meeting_instances.time).to - (meeting_instances.time).from)) / 60 / 60) as hours,
  meeting_instances.org,
  relation_people.user
from 
  meeting_instances
inner join
  relation_people on meeting_instances.id = relation_people.meeting
where
  meeting_instances.instance_time <= current_date
group by
  relation_people.user,
  meeting_instances.org;
