/* eslint-disable no-underscore-dangle, @typescript-eslint/ban-types, @typescript-eslint/naming-convention */

interface TransProps {
  i18nKey: string;
  components?: ReactNode[];
  values?: { [name: string]: string | number };
}

declare module 'next-translate/Trans' {
  export default function Trans(props: TransProps): JSX.Element;
}

interface I18nProps {
  t: (key: string, query?: { [name: string]: string | number }) => string;
  lang: string;
}

declare module 'next-translate/withTranslation' {
  export default function withTranslation<P extends Record<string, any>>(
    Component: React.ComponentType<P & { i18n: I18nProps }>
  ): React.FunctionComponent<P>;
}

declare module 'next-translate/useTranslation' {
  export default function useTranslation(): I18nProps;
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
