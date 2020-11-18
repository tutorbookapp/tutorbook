import { useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';
import useTranslation from 'next-translate/useTranslation';

import { useUser } from 'lib/context/user';

const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID as string;
const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

/**
 * Duplicate definition from the `lib/model` package. These are all the
 * valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

interface IntercomSettings {
  app_id: string;
  language_override: string;
  [key: string]: IntercomCustomAttribute;
}

/**
 * Type definitions for the various actions that can be performed using the
 * global `window.Intercom` object.
 * @see {@link https://developers.intercom.com/installing-intercom/docs/intercom-javascript}
 */

type Basics = (action: 'hide' | 'show' | 'shutdown' | 'showMessages') => void;
type Boot = (action: 'boot', settings: IntercomSettings) => void;
type NewMsg = (action: 'showNewMessage', message: string) => void;
type Update = (
  action: 'update',
  user: { [key: string]: IntercomCustomAttribute }
) => void;
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
  | Boot
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
  const { user } = useUser();
  const { lang: locale } = useTranslation();

  const [settings, setSettings] = useState<IntercomSettings>({
    app_id: appId,
    language_override: locale,
    hide_default_launcher: !visible,
    ...user.toIntercom(),
  });

  useEffect(() => {
    const updated = {
      app_id: appId,
      language_override: locale,
      hide_default_launcher: !visible,
      ...user.toIntercom(),
    };
    setSettings((prev) => {
      if (dequal(updated, prev)) return prev;
      return updated;
    });
  }, [locale, visible, user]);

  useEffect(() => {
    if (!canUseDOM) return;
    IntercomAPI('update', settings);
  }, [settings]);

  return null;
}
