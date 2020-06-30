import { MailData } from '@sendgrid/helpers/classes/mail';
import Utils from 'lib/utils';
import { SocialTypeAlias, SocialInterface, UserWithRoles } from 'lib/model';

export interface Email extends MailData {
  readonly html: string;
}

export interface VerificationInterface extends SocialInterface {
  label: string;
}

export type UserWithRolesAndVerifications = Omit<
  UserWithRoles,
  'verifications'
> & {
  verifications: {
    [type in SocialTypeAlias | 'school']: VerificationInterface;
  };
};

export function addVerifications(
  user: UserWithRoles
): UserWithRolesAndVerifications {
  return {
    ...user,
    verifications: Object.fromEntries(
      user.socials.map((social: SocialInterface) => {
        const { type, ...rest } = social;
        return [type, { label: Utils.caps(type), ...rest }];
      })
    ),
  } as UserWithRolesAndVerifications;
}
