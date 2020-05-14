# Emails

This repository contains all of our [Handlebars.js](https://handlebarsjs.com)
email templates. We use [Twilio SendGrid](https://sendgrid.com) to send our
emails and [Handlebars](https://handlebarsjs.org) to send customized HTML email
templates.

## Usage

Just import the email template you want to use, initialize it, and send it via
SendGrid's Node.js SDK like so:

```typescript
import { ParentApptEmail, Email } from '@tutorbook/emails';
import mail from '@sendgrid/mail';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

const email: Email = new ParentApptEmail(parent, recipient, appt, recipients);
await mail.send(email);
```

## Structure

Since we have a lot of emails and thus a lot of templates, this package is
actually rather large. It is organized like:

```
.
├── declarations.d.ts
├── email.ts
├── handlebars.ts
├── appt
│   ├── index.ts
│   └── template.hbs
├── parent-appt
│   ├── index.ts
│   └── template.hbs
└── verification
    ├── index.ts
    └── template.hbs

3 directories, 9 files
```

There are three top-level files that are shared by all our email templates:

1. The `declarations.d.ts` file defines the `*.hbs` module type so that
   Typescript doesn't error when we import our Handlebars templates.
2. The `email.ts` file defines an `Email` interface that extends SendGrid's
   required `MailData` interface (it adds required `recipient` and `html`
   properties). This interface is implemented by each of our email templates.
3. The `handlebars.ts` file defines some useful (and shared) Handlebars custom
   helpers.

Each email template then has it's own directory and includes:

1. The `index.ts` email definition file that contains the class that implements
   the `Email` interface. This class can be initialized and sent via SendGrid.
2. The `template.hbs` Handlebars file contains the HTML email template.

Each email template directory can have additional files but is required to have
the two above listed files.
