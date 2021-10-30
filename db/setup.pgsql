create domain url as text check (value ~ '^https?:\/\/\S+$');
create domain phone as text check (value ~ '^(\+\d{1,3})\d{10}$');
create domain email as text check (value ~ '^[A-Za-z0-9._~+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');
create domain rrule as text check (value ~ '^RRULE:FREQ=(WEEKLY|DAILY);?(INTERVAL=2;?)?(UNTIL=(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?)?$');

create type role as enum(
  'tutor', 
  'tutee', 
  'parent'
);
create type social_type as enum(
  'website', 
  'linkedin', 
  'twitter', 
  'facebook', 
  'instagram', 
  'github', 
  'indiehackers'
);
create type social as (
  "type" social_type,
  "url" url
);

create type timeslot as (
  "id" text,
  "from" timestamptz,
  "to" timestamptz,
  "exdates" timestamptz[],
  "recur" rrule,
  "last" timestamptz
);

-- TODO: See if there's a way to simply extend the existing `role` enum.
create type user_tag as enum (
  'vetted', 
  'meeting', 
  'tutor', 
  'tutee', 
  'parent',
  'not-vetted', 
  'not-meeting', 
  'not-tutor', 
  'not-tutee', 
  'not-parent'
);
create table public.users (
  "id" text unique not null primary key,
  "uid" uuid references auth.users(id) unique,
  "name" text not null check(length(name) > 1 AND name !~ '^\s+$'),
  "photo" url,
  "email" email unique,
  "phone" phone unique,
  "bio" text not null,
  "background" url,
  "venue" url,
  "socials" social[] not null,
  "availability" timeslot[] not null,
  "langs" text[] not null check(cardinality(langs) > 0),
  "visible" boolean not null,
  "reference" text not null,
  "timezone" text,
  "age" integer,
  "tags" user_tag[] not null,
  "created" timestamptz not null,
  "updated" timestamptz not null,
  "times" bigint[] not null
);

create type profile_field as enum(
  'name', 
  'photo', 
  'email', 
  'phone', 
  'bio', 
  'background', 
  'venue', 
  'availability', 
  'subjects', 
  'langs', 
  'reference'
); 
create table public.orgs (
  "id" text unique not null primary key,
  "name" text not null check(length(name) > 1 AND name !~ '^\s+$'),
  "photo" url,
  "email" email unique,
  "phone" phone unique,
  "bio" text not null,
  "background" url,
  "venue" url,
  "socials" social[] not null,
  "domains" text[] check(cardinality(domains) > 0),
  -- TODO: Check that at least one contact info field is included.
  "profiles" profile_field[] not null check(cardinality(profiles) > 3),
  -- TODO: Verify these are valid config objects.
  "signup" jsonb not null,
  "home" jsonb not null,
  "booking" jsonb not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create type verification_check as enum(
  'email', 
  'background-check', 
  'academic-email', 
  'training', 
  'interview'
);
create table public.verifications (
  "id" bigint generated always as identity primary key,
  "creator" text references public.users(id) on delete cascade on update cascade not null,
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  "checks" verification_check[] not null check(cardinality(checks) > 0),
  "notes" text not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create type meeting_tag as enum('recurring', 'not-recurring');
create table public.meetings (
  "id" bigint generated always as identity primary key,
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  "creator" text references public.users(id) on delete cascade on update cascade not null,
  "description" text not null,
  "tags" meeting_tag[] not null,
  "time" timeslot not null,
  "venue" url not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

-- create type category as enum (
  -- 'math',
  -- 'science',
  -- 'history',
  -- 'english',
  -- 'language',
  -- 'business',
  -- 'music',
  -- 'tests',
  -- 'art',
  -- 'cs'
-- );
-- create table public.subjects (
  -- "id" bigint generated always as identity primary key,
  -- "name" text not null check(length(name) > 1 AND name !~ '^\s+$') unique,
  -- "category" category not null
-- );

-- RELATIONS
-- These are the best way to setup many-to-many relationships in a relational
-- database like PostgreSQL (in order to use references properly).

create table relation_user_subjects (
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "subject" bigint references public.subjects(id) on delete cascade on update cascade not null,
  primary key ("user", "subject")
);
create table relation_org_subjects (
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  "subject" bigint references public.subjects(id) on delete cascade on update cascade not null,
  primary key ("org", "subject")
);
create table relation_meeting_subjects (
  "meeting" bigint references public.meetings(id) on delete cascade on update cascade not null,
  "subject" bigint references public.subjects(id) on delete cascade on update cascade not null,
  primary key ("meeting", "subject")
);

create table relation_parents (
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "parent" text references public.users(id) on delete cascade on update cascade not null,
  primary key ("user", "parent")
);
create table relation_orgs (
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  primary key ("user", "org")
);
create table relation_members (
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  primary key ("user", "org")
);

-- Note: I have to include "roles" in the primary key so users can book 
-- meetings with themselves (a common scenario when they're testing the app).
create table relation_people (
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "meeting" bigint references public.meetings(id) on delete cascade on update cascade not null,
  "roles" role[] not null check(cardinality(roles) > 0),
  primary key ("user", "meeting", "roles")
);

-- VIEWS
-- These views exist to make queries easier because:
-- 1. They're generally more performant than complex `JOIN` queries at runtime.
-- 2. Supabase doesn't support running raw SQL queries yet.
-- 3. Creating `JOIN` views abstracts away the many-to-many `relation_*` tables.
create view view_orgs as 
select 
  orgs.*,
  coalesce(subjects, null) as subjects,
  coalesce(members, array[]::text[]) as members
from orgs
  left outer join (
    select "org",json_agg(subjects.*) as subjects 
    from (
      select * from relation_org_subjects inner join 
      subjects on subjects.id = relation_org_subjects.subject
    ) as subjects group by "org"
  ) as subjects on subjects."org" = id
  left outer join (
    select "org",array_agg("user") as members 
    from relation_members group by "org"
  ) as members on members."org" = id
order by id;

create view view_meetings as
select 
  meetings.*,
  coalesce(subjects, '[]'::json) as subjects,
  coalesce(subject_ids, array[]::bigint[]) as subject_ids,
  -- TODO: Remove this `time_from` columns as they're only required b/c of an
  -- upstream limitation with PostgREST that disallows composite types.
  -- See: https://github.com/PostgREST/postgrest/issues/1543
  (meetings.time).from as time_from,
  (meetings.time).to as time_to,
  (meetings.time).last as time_last,
  people,
  coalesce(people_ids, array[]::text[]) as people_ids 
from meetings 
  left outer join (
    select 
      meeting,
      json_agg(subject.*) as subjects,
      array_agg(subject.id) as subject_ids
    from (
      select * from relation_meeting_subjects inner join 
      subjects on subjects.id = relation_meeting_subjects.subject
    ) as subject group by meeting
  ) as subjects on subjects.meeting = meetings.id
  left outer join (
    select 
      meeting,
      json_agg(person.*) as people,
      array_agg(person.id) as people_ids 
    from (
      -- TODO: Find a way to `json_agg(users.*, roles)` so that I can get rid of
      -- the `meeting` property from the aggregated `people` column of objs.
      select meeting,roles,users.* 
      from relation_people 
      inner join users on "user" = users.id
    ) as person group by meeting
  ) as people on people.meeting = meetings.id
order by meetings.id;

create view meeting_instances as
select 
  meetings.*,
  coalesce(subjects, '[]'::json) as subjects,
  (event_instances((meetings.time).from, (meetings.time).recur)) instance_time 
from meetings
  left outer join (
    select "meeting",json_agg(subjects.*) as subjects
    from (
      select * from relation_meeting_subjects inner join
      subjects on subjects.id = relation_meeting_subjects.subject
    ) as subjects group by "meeting"
  ) as subjects on subjects."meeting" = id
where (meetings.time).recur is not null
union all
select
  meetings.*,
  coalesce(subjects, '[]'::json) as subjects,
  ((meetings.time).from) instance_time
from meetings
  left outer join (
    select "meeting",json_agg(subjects.*) as subjects
    from (
      select * from relation_meeting_subjects inner join
      subjects on subjects.id = relation_meeting_subjects.subject
    ) as subjects group by "meeting"
  ) as subjects on subjects."meeting" = id
where (meetings.time).recur is null;

create view hours_cumulative as
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

create view hours_total as
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

create view view_users as 
select 
  users.*,
  cardinality(times) > 0 as available,
  coalesce(subjects, '[]'::json) as subjects,
  coalesce(subject_ids, array[]::bigint[]) as subject_ids,
  coalesce(orgs, array[]::text[]) as orgs,
  coalesce(parents, array[]::text[]) as parents,
  coalesce(meetings, '[]'::json) as meetings
from users 
  left outer join (
    select 
      "user",
      json_agg(subject.*) as subjects,
      array_agg(subject.id) as subject_ids
    from (
      select * from relation_user_subjects inner join 
      subjects on subjects.id = relation_user_subjects.subject
    ) as subject group by "user"
  ) as subjects on subjects."user" = id
  left outer join (
    select "user",array_agg(org) as orgs 
    from relation_orgs group by "user"
  ) as orgs on orgs."user" = id
  left outer join (
    select "user",array_agg(parent) as parents 
    from relation_parents group by "user"
  ) as parents on parents."user" = id
  left outer join (
    select "user",json_agg(meetings.*) as meetings
    from (
      select "user",meetings.*
      from meetings inner join relation_people
      on relation_people.meeting = meetings.id
    ) as meetings group by meetings."user"
  ) as meetings on meetings."user" = id
order by id;

-- FUNCTIONS
-- Function to get all the users that a person has meetings with. Note that
-- this includes the user itself (e.g. so a user can book a meeting with
-- themselves; a pretty common use-case when testing the app).
create function met(user_id text, user_role text)
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
