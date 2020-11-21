const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

type Basics = (action: 'hide' | 'show' | 'shutdown' | 'showMessages') => void;
type NewMsg = (action: 'showNewMessage', message: string) => void;
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
export default function IntercomAPI(...args: Parameters<IntercomGlobal>): void {
  if (canUseDOM && window.Intercom) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (window.Intercom as Function)(...args);
  } else if (canUseDOM) {
    console.warn('Intercom has not been initialized yet.');
  }
}
