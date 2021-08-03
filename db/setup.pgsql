create domain url as text check (value ~ '^https?:\/\/\S+$');
create domain phone as text check (value ~ '^(\+\d{1,3})\d{10}$');
create domain email as text check (value ~ '^[A-Za-z0-9._~+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');
create domain rrule as text check (value ~ '^RRULE:FREQ=(WEEKLY|DAILY);?(INTERVAL=2;?)?(UNTIL=(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?)?$');

create type aspect as enum ('mentoring', 'tutoring');
create type role as enum('tutor', 'tutee', 'mentor', 'mentee', 'parent');

create type social_type as enum('website', 'linkedin', 'twitter', 'facebook', 'instagram', 'github', 'indiehackers');
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
  'matched', 
  'meeting', 
  'tutor', 
  'tutee', 
  'mentor', 
  'mentee', 
  'parent',
  'not-vetted', 
  'not-matched', 
  'not-meeting', 
  'not-tutor', 
  'not-tutee', 
  'not-mentor', 
  'not-mentee', 
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
  "mentoring" text[] not null,
  "tutoring" text[] not null,
  "langs" text[] not null check(cardinality(langs) > 0),
  "visible" boolean not null,
  "featured" aspect[] not null,
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
  "aspects" aspect[] not null check(cardinality(aspects) > 0),
  "domains" text[] check(cardinality(domains) > 0),
  -- TODO: Check that at least one contact info field is included.
  "profiles" profile_field[] not null check(cardinality(profiles) > 3),
  "subjects" text[] check(cardinality(subjects) > 0),
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

create type match_tag as enum('meeting', 'not-meeting');
create table public.matches (
  "id" bigint generated always as identity primary key,
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  "creator" text references public.users(id) on delete cascade on update cascade not null,
  "subjects" text[] not null check(cardinality(subjects) > 0),
  "message" text not null,
  "tags" match_tag[] not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create type meeting_tag as enum('recurring', 'not-recurring');
create type meeting_status as enum('created', 'pending', 'logged', 'approved');
create table public.meetings (
  "id" bigint generated always as identity primary key,
  "org" text references public.orgs(id) on delete cascade on update cascade not null,
  "creator" text references public.users(id) on delete cascade on update cascade not null,
  "subjects" text[] not null check(cardinality(subjects) > 0),
  "status" meeting_status not null default 'created',
  "match" bigint references public.matches(id) on delete cascade on update cascade,
  "venue" url not null,
  "time" timeslot not null,
  "description" text not null,
  "tags" meeting_tag[] not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

-- RELATIONS
-- These are the best way to setup many-to-many relationships in a relational
-- database like PostgreSQL (in order to use references properly).
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

-- Note: I have to include "roles" in the primary key so users can book meetings
-- and create matches with themselves (a pretty common scenario when they're 
-- first testing out the app).
create table relation_match_people (
  "user" text references public.users(id) on delete cascade on update cascade not null,
  "match" bigint references public.matches(id) on delete cascade on update cascade not null,
  "roles" role[] not null check(cardinality(roles) > 0),
  primary key ("user", "match", "roles")
);
create table relation_meeting_people (
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
  coalesce(members, array[]::text[]) as members
from orgs
  left outer join (
    select "org",array_agg("user") as members 
    from relation_members group by "org"
  ) as members on members."org" = id
order by id;

create view view_users as 
select 
  users.*,
  cardinality(times) > 0 as available,
  coalesce(orgs, array[]::text[]) as orgs,
  coalesce(parents, array[]::text[]) as parents
from users 
  left outer join (
    select "user",array_agg(org) as orgs 
    from relation_orgs group by "user"
  ) as orgs on orgs."user" = id
  left outer join (
    select "user",array_agg(parent) as parents 
    from relation_parents group by "user"
  ) as parents on parents."user" = id
order by id;

create view view_matches as
select 
  matches.*,
  people,
  coalesce(people_ids,array[]::text[]) as people_ids
from matches left outer join (
  select 
    "match",
    json_agg(person.*) as people,
    array_agg(person.id) as people_ids 
  from (
    -- TODO: Find a way to `json_agg(users.*, roles)` so that I can get rid of
    -- the `"match"` property from the aggregated `people` column of objs.
    select "match",roles,users.* 
    from relation_match_people 
    inner join users on "user" = users.id
  ) as person group by "match"
) as people on "match" = matches.id
order by matches.id;

create view view_meetings as
select 
  meetings.*,
  -- TODO: Remove this `time_from` columns as they're only required b/c of an
  -- upstream limitation with PostgREST that disallows composite types.
  -- See: https://github.com/PostgREST/postgrest/issues/1543
  (meetings.time).from as time_from,
  (meetings.time).to as time_to,
  (meetings.time).last as time_last,
  people,
  coalesce(people_ids,array[]::text[]) as people_ids 
from meetings left outer join (
  select 
    meeting,
    json_agg(person.*) as people,
    array_agg(person.id) as people_ids 
  from (
    -- TODO: Find a way to `json_agg(users.*, roles)` so that I can get rid of
    -- the `meeting` property from the aggregated `people` column of objs.
    select meeting,roles,users.* 
    from relation_meeting_people 
    inner join users on "user" = users.id
  ) as person group by meeting
) as people on meeting = meetings.id
order by meetings.id;
