import { useEffect, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { useUser } from 'lib/account';

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

type Intercom =
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
    Intercom: Intercom;
    intercomSettings: IntercomSettings;
  }
}

/**
 * Wrapper around the Intercom JavaScript API. This just catches errors that
 * would otherwise occur during SSR (when `window.Intercom` isn't populated).
 * @see {@link https://developers.intercom.com/installing-intercom/docs/intercom-javascript}
 */
export function IntercomAPI(...args: Parameters<Intercom>): void {
  if (canUseDOM && window.Intercom) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (window.Intercom as Function)(...args);
  } else if (canUseDOM) {
    console.warn('[WARNING] Intercom has not been initialized yet.');
  }
}

export default function Intercom(): JSX.Element {
  const { user } = useUser();
  const { lang: locale } = useTranslation();

  const intercomSettings = useMemo(
    () => ({
      app_id: appId,
      language_override: locale,
      hide_default_launcher: true,
      ...user.toIntercom(),
    }),
    [locale, user]
  );

  useEffect(() => {
    if (canUseDOM) {
      if (!window.Intercom) {
        ((w: Window, d: Document, id: string) => {
          function i(...args: any[]) {
            i.c(args);
          }
          i.q = [] as any[];
          i.c = (args: any) => i.q.push(args);
          /* eslint-disable-next-line no-param-reassign */
          w.Intercom = i;
          const s: HTMLScriptElement = d.createElement('script');
          s.async = true;
          s.src = `https://widget.intercom.io/widget/${id}`;
          d.head.appendChild(s);
        })(window, document, appId);
      }
      window.intercomSettings = intercomSettings;
      IntercomAPI('boot', intercomSettings);
    } else {
      console.warn('[WARNING] No DOM, skipping Intercom initialization.');
    }
    return () => {
      // Right now, we boot and shutdown Intercom on every page navigation (even
      // if that navigation occurs client-side).
      IntercomAPI('shutdown');
      delete window.Intercom;
      delete window.intercomSettings;
    };
  });

  useEffect(() => {
    if (!canUseDOM) {
      console.warn('[WARNING] No DOM, skipping Intercom update.');
    } else {
      window.intercomSettings = intercomSettings;
      IntercomAPI('update', intercomSettings);
    }
  }, [intercomSettings]);

  return <></>;
}
