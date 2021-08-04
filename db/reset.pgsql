create or replace function reset()
returns void as
$$
  drop domain url cascade;
  drop domain phone cascade;
  drop domain email cascade;
  drop domain rrule cascade;

  drop type aspect cascade;
  drop type role cascade;

  drop type social_type cascade;
  drop type social cascade;

  drop type timeslot cascade;

  drop type user_tag cascade;
  drop table public.users cascade;

  drop type profile_field cascade;
  drop table public.orgs cascade;

  drop type verification_check cascade;
  drop table public.verifications cascade;

  drop type match_tag cascade;
  drop table public.matches cascade;

  drop type meeting_tag cascade;
  drop type meeting_status cascade;
  drop table public.meetings cascade;

  drop table relation_parents cascade;
  drop table relation_orgs cascade;
  drop table relation_members cascade;
  drop table relation_match_people cascade;
  drop table relation_meeting_people cascade;

  drop view if exists view_orgs cascade;
  drop view if exists view_users cascade;
  drop view if exists view_matches cascade;
  drop view if exists view_meetings cascade;
$$
language sql volatile;
