# `mail`

Tutorbook's email system. There are only a few different emails that Tutorbook
sends. I try to keep this number as low as possible intentionally (people get
enough email already):

1. **Meeting created** - When a new meeting is created, we send an email to all
   the meeting people (CC-ing the meeting creator).
2. **Meeting updated** - When a meeting is updated, we send an email to all the
   meeting people (CC-ing the editor) letting them know which edits were made.
3. **Meeting reminders** - There are a couple of different reminder emails.
   These emails can get really annoying really easily, so I try to keep them
   minimal and helpful: one a day before, another an hour before, and a final
   one right after the meeting with various CTAs (e.g. write a review, make it
   recurring, donate).
4. **User created** - When a new user signs up, we notify all the org admins.

All of those emails can be unsubscribed from and individually configured.
