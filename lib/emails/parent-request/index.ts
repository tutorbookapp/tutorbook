import Utils from '@tutorbook/utils';
import { Appt, User, UserWithRoles } from '@tutorbook/model';

import * as admin from 'firebase-admin';

import {
  Email,
  UserWithRolesAndVerifications,
  addVerifications,
} from '../common';
import Handlebars from '../handlebars';
import Template from './template.hbs';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentReference = admin.firestore.DocumentReference;

interface Data {
  brambleDescription: string;
  approveURL: string;
  pupil: User;
  parent: User;
  attendees: UserWithRolesAndVerifications[];
  appt: Appt;
}

/**
 * Email sent out to the `parents` of the pupil `attendees` when a new pending
 * lesson request is created. The lesson request stays "pending" until the
 * parents approve of the pupil-tutor match by opening this email and clicking
 * on the "APPROVE" CTA.
 */
export default class ParentRequestEmail implements Email {
  private static readonly render: Handlebars.TemplateDelegate<
    Data
  > = Handlebars.compile(Template);

  public readonly from: string = 'Tutorbook <team@tutorbook.org>';

  public readonly bcc: string = 'team@tutorbook.org';

  public readonly to: string;

  public readonly subject: string;

  public readonly html: string;

  public readonly text: string;

  public constructor(
    parent: User,
    pupil: UserWithRoles,
    appt: Appt,
    attendees: ReadonlyArray<UserWithRoles>
  ) {
    this.to = parent.email;
    this.subject = `${pupil.firstName} scheduled ${Utils.join(
      appt.subjects
    )} lessons on Tutorbook!`;
    this.text = this.subject;
    const linkStyling = `color:#067df7!important;font-size:inherit;text-decoration:none`;
    const data: Data = {
      approveURL:
        `https://tutorbook.org/approve` +
        `?request=${encodeURIComponent((appt.ref as DocumentReference).path)}` +
        `&id=${encodeURIComponent(parent.id)}`,
      brambleDescription:
        `They will be conducting their tutoring lessons via <a href="` +
        `${appt.venues[0].url}" style="${linkStyling}">this Bramble room</a>.` +
        ` The room will be reused weekly until the tutoring lesson is ` +
        `canceled. Learn more about Bramble <a href="https://about.bramble.` +
        `io/help/help-home.html" style="${linkStyling}">here</a>.`,
      attendees: attendees.map((a: UserWithRoles) => addVerifications(a)),
      appt,
      pupil,
      parent,
    };
    this.html = ParentRequestEmail.render(data);
  }
}
