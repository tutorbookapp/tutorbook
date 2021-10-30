drop domain url cascade;
drop domain phone cascade;
drop domain email cascade;
drop domain rrule cascade;

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

drop type meeting_tag cascade;
drop table public.meetings cascade;

-- drop type category cascade;
-- drop table public.subjects cascade;

drop table relation_user_subjects cascade;
drop table relation_org_subjects cascade;
drop table relation_meeting_subjects cascade;

drop table relation_parents cascade;
drop table relation_orgs cascade;
drop table relation_members cascade;
drop table relation_people cascade;

drop view if exists view_orgs cascade;
drop view if exists view_meetings cascade;
drop view if exists meeting_instances cascade;
drop view if exists hours_cumulative cascade; 
drop view if exists hours_total cascade;
drop view if exists view_users cascade;
