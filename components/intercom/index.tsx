import { useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import { Org } from 'lib/model';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID as string;
const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

interface IntercomSettings {
  app_id: string;
  language_override: string;
  email: string;
  user_id: string;
  name: string;
  phone: string;
  avatar: { type: string; image_url: string };
  company?: Company;
  companies: Company[];
}

interface Company {
  id: string;
  name: string;
  website: string;
}

/**
 * Type definitions for the various actions that can be performed using the
 * global `window.Intercom` object.
 * @see {@link https://developers.intercom.com/installing-intercom/docs/intercom-javascript}
 */
type Basics = (action: 'hide' | 'show' | 'shutdown' | 'showMessages') => void;
type NewMsg = (action: 'showNewMessage', message: string) => void;
type Update = (action: 'update', settings?: IntercomSettings) => void;
type TrackEvt = (action: 'trackEvent', event: string) => void;
type Visitor = (action: 'getVisitorId') => string;
type StartTour = (action: 'startTour', tourId: number) => void;

type Callbacks = (trigger: 'onHide' | 'onShow', callback: () => void) => void;
type Unread = (
  trigger: 'onUnreadCountChange',
  callback: (unread: number) => void
) => void;

type IntercomGlobal =
  | Basics
  | NewMsg
  | Update
  | TrackEvt
  | Visitor
  | StartTour
  | Callbacks
  | Unread;

declare global {
  interface Window {
    Intercom: IntercomGlobal;
  }
}

/**
 * Wrapper around the Intercom JavaScript API. This just catches errors that
 * would otherwise occur during SSR (when `window.Intercom` isn't populated).
 * @see {@link https://developers.intercom.com/installing-intercom/docs/intercom-javascript}
 */
export function IntercomAPI(...args: Parameters<IntercomGlobal>): void {
  if (canUseDOM && window.Intercom) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (window.Intercom as Function)(...args);
  } else if (canUseDOM) {
    console.warn('Intercom has not been initialized yet.');
  }
}

export interface IntercomProps {
  visible?: boolean;
}

export default function Intercom({ visible }: IntercomProps): null {
  const { org } = useOrg();
  const { user, orgs } = useUser();
  const { lang: locale } = useTranslation();

  const [settings, setSettings] = useState<IntercomSettings>();

  useEffect(() => {
    const orgToCompany = (o: Org) => {
      const website = o.socials.filter((s) => s.type === 'website')[0];
      return { id: o.id, name: o.name, website: website?.url || '' };
    };
    const updated = {
      app_id: appId,
      language_override: locale,
      hide_default_launcher: !visible,
      email: user.email,
      user_id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: { type: 'avatar', image_url: user.photo },
      company: org ? orgToCompany(org) : undefined,
      companies: orgs.map(orgToCompany),
    };
    setSettings((prev) => {
      if (dequal(updated, prev)) return prev;
      return updated;
    });
  }, [locale, visible, user, orgs, org]);

  useEffect(() => {
    if (!canUseDOM) return;
    IntercomAPI('update', settings);
  }, [settings]);

  return null;
}
