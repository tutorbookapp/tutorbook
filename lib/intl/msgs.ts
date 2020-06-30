import { SocialTypeAlias } from '@tutorbook/model';

import { defMsg, Msg } from './index';

/* eslint-disable-next-line import/prefer-default-export */
export const socials: Record<SocialTypeAlias, Msg> = defMsg({
  facebook: {
    id: 'socials.facebook',
    defaultMessage: 'Facebook',
  },
  instagram: {
    id: 'socials.instagram',
    defaultMessage: 'Instagram',
  },
  twitter: {
    id: 'socials.twitter',
    defaultMessage: 'Twitter',
  },
  linkedin: {
    id: 'socials.linkedin',
    defaultMessage: 'LinkedIn',
  },
  github: {
    id: 'socials.github',
    defaultMessage: 'GitHub',
  },
  website: {
    id: 'socials.website',
    defaultMessage: 'Website',
  },
  indiehackers: {
    id: 'socials.indiehackers',
    defaultMessage: 'IndieHackers',
  },
});
