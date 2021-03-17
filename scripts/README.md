# Utilities

Included here are some (somewhat) useful sets of utilities. Each directory here
should have it's own `README.md` that can be referred to for usage information,
etc.

Also note that most of these utilities were ported over from [Tutorbook's
primary web app repository](https://github.com/tutorbookapp/tutorbook) and thus
most issues regarding these utilities should be reported there.

## Firebase Requirements

Before you can run (most) of our Firebase-related utilities, you must first
generate and download a service account key by following [these
instructions](https://firebase.google.com/docs/admin/setup#initialize-sdk).

Once you do, make sure that key is in this directory and is named
`admin-cred.json` (i.e. `utils/admin-cred.json`).
