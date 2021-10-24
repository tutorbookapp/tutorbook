# `mail`

Tutorbook's email system. There are only a few different emails that Tutorbook
sends. I try to keep this number as low as possible intentionally (people get
enough email already):

1. **Meeting created** - When a new meeting is created, I send an email to all
   the meeting people (CC-ing the meeting creator).
2. **Meeting updated** - When a meeting is updated, I send an email to all the
   meeting people (CC-ing the editor) letting them know which edits were made.
3. **Meeting deleted** - When a meeting is canceled, I send an email to all the
   meeting people (CC-ing the deleter).
4. **Meeting reminders** - There are a couple of different reminder emails.
   These emails can get really annoying really easily, so I try to keep them
   minimal and helpful: one a day before, another an hour before, and a final
   one right after the meeting with various CTAs (e.g. write a review, make it
   recurring, donate).
5. **User created** - When a new user signs up, I notify all the org admins.
6. **Login confirmation** - I send magic links when users choose to login with
   their email address (instead of Google).

All of those emails can be unsubscribed from and individually configured.

## Components

Each of Tutorbook's email templates is simply a React component. Certain 
components that are reused across emails are defined in the `components.tsx`
file and imported into each email template file.
