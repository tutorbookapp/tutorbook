# Firestore Utilities

A set of utilities for managing and backing up our Firestore database (e.g.
deleting indexes, saving data as locally stored JSON).

These utilities were originally copied over from [Tutorbook's primary web app
repository](https://github.com/tutorbookapp/tutorbook) so any issues should
(most likely) be reported there.

## Index Management

To delete all of our indexes via Firestore's [Google Cloud REST
API](https://cloud.google.com/firestore/docs/reference/rest/v1beta1/projects.databases.indexes/list)
first make sure to replace the `TODO` string constants (e.g. add the Google
Cloud Platform OAuth 2.0 client information) in `delete-indexes.js`. Then, run:

```commandline
$ node delete-indexes.js
```
