import React from 'react';

import { IntlShape, useIntl } from 'react-intl';
import { UserContext } from '@tutorbook/firebase';
import { User } from '@tutorbook/model';

const appID: string = 'faz7lcyb';
const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

/**
 * Duplicate definition from the `@tutorbook/model` package. These are all the
 * valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

interface IntercomSettings {
  app_id: string;
  language_override: string;
  [key: string]: IntercomCustomAttribute;
}

interface IntercomProps {
  locale: string;
  user: User;
}

declare global {
  interface Window {
    Intercom: any;
    intercomSettings: IntercomSettings;
  }
}

/**
 * @deprecated I haven't tested this at all and I don't think we'll need it for
 * our use case anyways.
 * @see {@link https://github.com/nhagen/react-intercom#usage}
 */
export function IntercomAPI(...args: [string, IntercomSettings?]): void {
  if (canUseDOM && window.Intercom) {
    window.Intercom.apply(null, args);
  } else {
    console.warn('[WARNING] Intercom has not been initialized yet.');
  }
}

class Intercom extends React.Component<IntercomProps> {
  public constructor(props: IntercomProps) {
    super(props);
    if (canUseDOM) {
      if (!window.Intercom) {
        (function (w: Window, d: Document, id: string) {
          function i() {
            i.c(arguments);
          }
          i.q = [] as any[];
          i.c = function (args: any) {
            i.q.push(args);
          };
          w.Intercom = i;
          const s: HTMLScriptElement = d.createElement('script');
          s.async = true;
          s.src = 'https://widget.intercom.io/widget/' + id;
          d.head.appendChild(s);
        })(window, document, appID);
      }
      window.intercomSettings = this.settings;
      if (window.Intercom) window.Intercom('boot', this.settings);
    } else {
      console.warn('[WARNING] No DOM, skipping Intercom initialization.');
    }
  }

  private get settings(): IntercomSettings {
    return {
      app_id: appID,
      language_override: this.props.locale,
      ...this.props.user.toIntercom(),
    };
  }

  public componentDidUpdate(prevProps: IntercomProps): void {
    if (!canUseDOM) {
    } else {
      window.intercomSettings = this.settings;

      const loggedIn = (props: IntercomProps) => !!props.user.uid;

      if (window.Intercom) {
        if (loggedIn(prevProps) && !loggedIn(this.props)) {
          // Shutdown & boot each time the user logs out to clear conversations.
          window.Intercom('shutdown');
          window.Intercom('boot', this.settings);
        } else {
          window.Intercom('update', this.settings);
        }
      }
    }
  }

  public componentWillUnmount(): void {
    if (!canUseDOM || !window.Intercom) {
    } else {
      window.Intercom('shutdown');
      delete window.Intercom;
      delete window.intercomSettings;
    }
  }

  public render(): boolean {
    return false;
  }
}

export default function IntercomHOC(): JSX.Element {
  const intl: IntlShape = useIntl();
  return (
    <UserContext.Consumer>
      {({ user }) => <Intercom user={user} locale={intl.locale} />}
    </UserContext.Consumer>
  );
}
