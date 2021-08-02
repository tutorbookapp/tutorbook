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

/* TODO: See if there's a way to simply extend the existing `role` enum. */
create type user_tag as enum ('vetted', 'matched', 'meeting', 'tutor', 'tutee', 'mentor', 'mentee', 'parent');
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
  "updated" timestamptz not null
);

create type profile_field as enum('name', 'photo', 'email', 'phone', 'bio', 'background', 'venue', 'availability', 'subjects', 'langs', 'reference'); 
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
  /* TODO: Check that at least one contact info field is included. */
  "profiles" profile_field[] not null check(cardinality(profiles) > 3),
  "subjects" text[] check(cardinality(subjects) > 0),
  /* TODO: Verify these are valid config objects. */
  "signup" jsonb not null,
  "home" jsonb not null,
  "booking" jsonb not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create type verification_check as enum('email', 'background-check', 'academic-email', 'training', 'interview');
create table public.verifications (
  "id" bigint generated always as identity primary key,
  "creator" text references public.users(id) on delete cascade not null,
  "user" text references public.users(id) on delete cascade not null,
  "org" text references public.orgs(id) on delete cascade not null,
  "checks" verification_check[] not null check(cardinality(checks) > 0),
  "notes" text not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create type match_tag as enum('meeting');
create table public.matches (
  "id" bigint generated always as identity primary key,
  "org" text references public.orgs(id) on delete cascade not null,
  "creator" text references public.users(id) on delete cascade not null,
  "subjects" text[] not null check(cardinality(subjects) > 0),
  "message" text not null,
  "tags" match_tag[] not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create type meeting_tag as enum('recurring');
create type meeting_status as enum('created', 'pending', 'logged', 'approved');
create table public.meetings (
  "id" bigint generated always as identity primary key,
  "org" text references public.orgs(id) on delete cascade not null,
  "creator" text references public.users(id) on delete cascade not null,
  "subjects" text[] not null check(cardinality(subjects) > 0),
  "status" meeting_status not null default 'created',
  "match" bigint references public.matches(id) on delete cascade,
  "venue" url not null,
  "time" timeslot not null,
  "description" text not null,
  "tags" meeting_tag[] not null,
  "created" timestamptz not null,
  "updated" timestamptz not null
);

create table relation_parents (
  "user" text references public.users(id) on delete cascade not null,
  "parent" text references public.users(id) on delete cascade not null,
  primary key ("user", "parent")
);
create table relation_orgs (
  "user" text references public.users(id) on delete cascade not null,
  "org" text references public.orgs(id) on delete cascade not null,
  primary key ("user", "org")
);
create table relation_members (
  "user" text references public.users(id) on delete cascade not null,
  "org" text references public.orgs(id) on delete cascade not null,
  primary key ("user", "org")
);

/* 
Note: I have to include "roles" in the primary key so users can book meetings
and create matches with themselves (a pretty common scenario when they're first
testing out the app.
*/

create table relation_match_people (
  "user" text references public.users(id) on delete cascade not null,
  "match" bigint references public.matches(id) on delete cascade not null,
  "roles" role[] not null check(cardinality(roles) > 0),
  primary key ("user", "match", "roles")
);
create table relation_meeting_people (
  "user" text references public.users(id) on delete cascade not null,
  "meeting" bigint references public.meetings(id) on delete cascade not null,
  "roles" role[] not null check(cardinality(roles) > 0),
  primary key ("user", "meeting", "roles")
);
