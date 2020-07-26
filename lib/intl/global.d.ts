/* eslint-disable no-underscore-dangle, @typescript-eslint/ban-types, @typescript-eslint/naming-convention */

declare module 'next-translate/useTranslation' {
  export default function useTranslation(): {
    t: (key: string, query?: { [name: string]: string | number }) => string;
    lang: string;
  };
}

declare module 'next-translate/appWithI18n' {
  type Config = {
    defaultLanguage?: string;
    allLanguages?: Array<string>;
    ignoreRoutes?: Array<string>;
    redirectToDefaultLang?: boolean;
    currentPagesDir?: string;
    finalPagesDir?: string;
    localesPath?: string;
    loadLocaleFrom?: (lang: string, ns: string) => void;
    pages?: { [name: string]: Array<string> };
  };

  export default function appWithI18n(App: FunctionComponent, config: Config);
}

declare module 'next-translate/I18nProvider' {
  export default function I18nProvider(props: {
    lang: string;
    namespaces: object;
    children: ReactNode;
  }): ReactElement;
}

declare module 'next-translate/Router' {
  type RouterAdditions = {
    pushI18n(path: string, as?: string, options?: {}): void;
    replaceI18n(path: string, as?: string, options?: {}): void;
  };
  export type Router = import('next/router').SingletonRouter & RouterAdditions;
  declare const _default: Router;
  export default _default;
}

declare module 'next-translate/Link' {
  type NextLink = import('next/link');
  declare const _default: NextLink;
  export default _default;
}
