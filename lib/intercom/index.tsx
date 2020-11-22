const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

interface Settings {
  hide_default_launcher: boolean;
  user_hash?: string;
}

type Boot = (action: 'boot', settings?: Settings) => void;
type Basics = (action: 'hide' | 'show' | 'shutdown' | 'showMessages') => void;
type Update = (action: 'update', settings: Settings) => void;
type NewMessage = (action: 'showNewMessage', message: string) => void;
type StartTour = (action: 'startTour', tourId: number) => void;
type Visitor = (action: 'getVisitorId') => string;

type IntercomGlobal = Boot | Basics | Update | NewMessage | StartTour | Visitor;

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
export default function Intercom(...args: Parameters<IntercomGlobal>): void {
  if (canUseDOM && window.Intercom) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (window.Intercom as Function)(...args);
  } else if (canUseDOM) {
    console.warn('Intercom has not been initialized yet.');
  }
}
